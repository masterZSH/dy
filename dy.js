const puppeteer = require('puppeteer');
const mysql = require('mysql');
const mysql_config = require('./conf/mysql')();
const env = process.env;
const instance_id = env.NODE_APP_INSTANCE === undefined ? 0 : env.NODE_APP_INSTANCE;
const instances = env.instances === undefined ? 1 : env.instances;
const AipOcr = require('./lib/src/index').ocr;
const fs = require("fs");
const bd = require('./conf/bd')();
let ocrObj = new AipOcr(bd.AppID, bd.API_Key, bd.Secret_Key);
function z_request(url) {
    (async () => {
        const browser = await puppeteer.launch({
            headless: false,
        });
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitFor(3000);

        async function screenshotZan(page, selector, path) {
            const res = await page.evaluate(selector => {
                try {
                    const element = document.querySelectorAll(selector)[2];
                    // 隐藏下方的下载遮罩
                    document.getElementById("download").style.display = "none";
                    document.querySelector(".signature").style.display = "none";
                    const {x, y, width, height} = element.getBoundingClientRect();
                    return clip = {
                        x: x + 100,
                        y: y + 130,
                        width: width + 110,
                        height: height
                    }
                } catch (e) {
                    return null;
                }
            }, selector);
            await page.screenshot({
                path: path,
                clip: res
            })
        }
        let zanPath = `${instance_id}_0.png`;
        await screenshotZan(page, ".num", zanPath);
        getWords(zanPath).then(function (res) {
            console.log(`总点赞数：${res}`);
        });
        async function screenshotNum(page, selector, path) {
            const res = await page.evaluate(selector => {
                try {
                    const element = document.querySelectorAll(selector)[3];
                    // 隐藏下方的下载遮罩
                    document.getElementById("download").style.display = "none";
                    document.querySelector(".signature").style.display = "none";
                    const {x, y, width, height} = element.getBoundingClientRect();
                    return clip = {
                        x: x + 50,
                        y: y + 150,
                        width: width + 100,
                        height: height
                    }
                } catch (e) {
                    return null;
                }
            }, selector);
            await page.screenshot({
                path: path,
                clip: res
            })
        }

        let numPath = `${instance_id}_1.png`;
        await screenshotNum(page, ".num", numPath);
        await browser.close();
        getWords(numPath, 2).then(function (res) {
            console.log(`总作品书: ${res}`);
        });
    })();
}
async function getWords(imgUrl, type = 1) {
    let image = fs.readFileSync(imgUrl);
    let base64Img = image.toString("base64");
    const res = await ocrObj.generalBasic(base64Img);
    if (res.error_code) {
        return '';
    }
    else {
        let words = res['words_result'][0]['words'];
        words = words.replace('赞', '');
        let num = words;
        if (type == 2) {
            return words.replace('W', '');
        }

        if (-1 == String.prototype.indexOf.call(words, 'W')) {
            num = (num / 10000).toFixed(2);
        }
        else {
            num = words.replace('W', '');
        }
        return num;
    }
}
z_request('https://www.douyin.com/share/user/61811995653?share_type=link');
