const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const crypto = require("crypto");
const request = require("request");
const path = require("path");
require("dotenv").config();


async function randomUserAgent() {
    const osVersions = `${Math.floor(Math.random() * 11) + 10}_${Math.floor(Math.random() * 15)}`;
    const platforms = ["Windows", "Macintosh", "X11", "Linux"];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    let os;
    if (platform === "Windows") {
        os = `Windows NT ${Math.floor(Math.random() * 5) + 6}.${Math.floor(Math.random() * 4)}; Win64; x64`;
    } else if (platform === "Macintosh") {
        os = `Macintosh; Intel Mac OS X 10_${osVersions}`;
    }

    const webKits = [
        `AppleWebKit/${Math.floor(Math.random() * 401) + 500}.36 (KHTML, like Gecko)`,
        "Gecko/20100101"
    ];
    
    const webKit = webKits[Math.floor(Math.random() * webKits.length)];
    const browser =`Chrome/${Math.floor(Math.random() * 31) + 60}.0.${Math.floor(Math.random() * 3001) + 1000}.${Math.floor(Math.random() * 200)}`;

    return `Mozilla/5.0 (${os}) ${webKit} ${browser}`;
}

const extensionId = "caacbgbklghmpodbdafajbgdnegacfmo";
const CRX_URL = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=98.0.4758.102&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc&nacl_arch=x86-64`;
const USER_AGENT = await randomUserAgent();

const USER = process.env.APP_USER || "";
const PASSWORD = process.env.APP_PASS || "";
const ALLOW_DEBUG = process.env.ALLOW_DEBUG === "True";
const EXTENSION_FILENAME = "app.crx";

console.log("-> Starting...");
console.log("-> User:", USER);
console.log("-> Pass:", PASSWORD);
console.log("-> Debug:", ALLOW_DEBUG);

if (!USER || !PASSWORD) {
    console.error("Please set APP_USER and APP_PASS env variables");
    process.exit();
}

if (ALLOW_DEBUG) {
    console.log("-> Debugging is enabled! This will generate a screenshot and console logs on error!");
}

async function downloadExtension(extensionId) {
    const url = CRX_URL.replace(extensionId, extensionId);
    const headers = { "User-Agent": USER_AGENT };

    console.log("-> Downloading extension from:", url);

    if (fs.existsSync(EXTENSION_FILENAME) && fs.statSync(EXTENSION_FILENAME).mtime > Date.now() - 86400 * 1000) {
        console.log("-> Extension already downloaded! Skip download...");
        return;
    }

    return new Promise((resolve, reject) => {
        request({ url, headers, encoding: null }, (error, response, body) => {
            if (error) {
                console.error("Error downloading extension:", error);
                return reject(error);
            }
            fs.writeFileSync(EXTENSION_FILENAME, body);
            if (ALLOW_DEBUG) {
                const md5 = crypto.createHash("md5").update(body).digest("hex");
                console.log("-> Extension MD5: " + md5);
            }
            resolve();
        });
    });
}

async function takeScreenshot(driver, filename) {
    const data = await driver.takeScreenshot();
    fs.writeFileSync(filename, Buffer.from(data, "base64"));
}

async function generateErrorReport(driver) {
    await takeScreenshot(driver, "error.png");

    const logs = await driver.manage().logs().get("browser");
    fs.writeFileSync(
        "error.log",
        logs.map((log) => `${log.level.name}: ${log.message}`).join("\n")
    );
}

async function getDriverOptions() {
    const options = new chrome.Options();

    options.addArguments(`user-agent=${USER_AGENT}`);
    options.addArguments("--headless=new");
    options.addArguments("--ignore-certificate-errors");
    options.addArguments("--ignore-ssl-errors");
    options.addArguments("--no-sandbox");
    options.addArguments("--remote-allow-origins=*");
    options.addArguments("enable-automation");
    options.addArguments("--dns-prefetch-disable");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--disable-ipv6");
    options.addArguments("--aggressive-cache-discard");
    options.addArguments("--disable-cache");
    options.addArguments("--disable-application-cache");
    options.addArguments("--disable-offline-load-stale-cache");
    options.addArguments("--disk-cache-size=0");

    console.log("-> No proxy set!");

    return options;
}

(async () => {
    await downloadExtension(extensionId);

    const options = await getDriverOptions();
    options.addExtensions(path.resolve(__dirname, EXTENSION_FILENAME));
    console.log(`-> Extension added! ${EXTENSION_FILENAME}`);

    if (ALLOW_DEBUG) {
        options.addArguments("--enable-logging");
        options.addArguments("--v=1");
    }

    let driver;
    try {
        console.log("-> Starting browser...");
        console.log("-> (this may take 5-10 minutes, please wait)");

        driver = await new Builder()
            .forBrowser("chrome")
            .setChromeOptions(options)
            .build();

        console.log("-> Browser started!");

        console.log("-> Started! Logging in https://app.gradient.network/...");
        await driver.get("https://app.gradient.network/");

        const emailInput = By.css('[placeholder="Enter Email"]');
        const passwordInput = By.css('[type="password"]');
        const loginButton = By.css("button");

        await takeScreenshot(driver, "login-page.png");

        await driver.wait(until.elementLocated(emailInput), 30000);
        await driver.wait(until.elementLocated(passwordInput), 30000);
        await driver.wait(until.elementLocated(loginButton), 30000);

        await driver.findElement(emailInput).sendKeys(USER);
        await driver.findElement(passwordInput).sendKeys(PASSWORD);
        await driver.findElement(loginButton).click();

        await driver.wait(
            until.elementLocated(By.xpath('//*[contains(text(), "Copy Referral Link")]')),
            30000
        );

        console.log("-> Logged in! Waiting for open extension...");

        await driver.get(`chrome-extension://${extensionId}/popup.html`);

        await driver.wait(
            until.elementLocated(By.xpath('//div[contains(text(), "Status")]')),
            30000
        );

        console.log("-> Extension loaded!");

        try {
            const gotItButton = await driver.findElement(
                By.xpath('//button[contains(text(), "I got it")]')
            );
            await gotItButton.click();
            console.log('-> "I got it" button clicked!');
        } catch (error) {
            const dom = await driver.findElement(By.css("html")).getAttribute("outerHTML");
            fs.writeFileSync("dom.html", dom);
            console.error('-> No "I got it" button found!(skip)');
        }

        try {
            const notAvailable = await driver.findElement(
                By.xpath('//*[contains(text(), "Sorry, Gradient is not yet available in your region.")]')
            );
            console.log("-> Sorry, Gradient is not yet available in your region.");
            await driver.quit();
            process.exit(1);
        } catch (error) {
            console.log("-> Gradient is available in your region.");
        }

        await driver.wait(
            until.elementLocated(By.xpath('//*[contains(text(), "Today\'s Taps")]')),
            30000
        );

        const supportStatus = await driver
            .findElement(By.css(".absolute.mt-3.right-0.z-10"))
            .getText();

        const dom = await driver.findElement(By.css("html")).getAttribute("outerHTML");
        fs.writeFileSync("dom.html", dom);

        await takeScreenshot(driver, "status.png");

        console.log("-> Status:", supportStatus);

        if (supportStatus.includes("Disconnected")) {
            console.log("-> Failed to connect! Please check the connection settings.");
            await generateErrorReport(driver);
            await driver.quit();
            setTimeout(() => {
                process.exit(1);
            }, 5000);
        }

        console.log("-> Connected! Starting rolling...");
        takeScreenshot(driver, "connected.png");

        console.log({ support_status: supportStatus });
        console.log("-> Launched!");

        setInterval(() => {
            driver.getTitle().then((title) => {
                console.log(`-> [${USER}] Running...`, title);
            });
            console.log(`-> [${USER}] Running without proxy...`);
        }, 10000);
    } catch (error) {
        console.error("Error occurred:", error);
        console.error(error.stack);

        if (driver) {
            await generateErrorReport(driver);
            driver.quit();
            process.exit(1);
        }
    }
})();
