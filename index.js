const fs = require("fs");
const path = require("path");
const child = require("child_process");
const readline = require("readline/promises");

const SUPPORTED_FILE_EXTENSIONS = ["png", "json"];

const SEARCH_FOLDER_PATH_RAW = process.argv[2];
const SEARCH_TEXT = process.argv[3];

if (!SEARCH_FOLDER_PATH_RAW) {
    console.log("検索フォルダを引数に入力してください。");
    process.exit(1);
}
if (!SEARCH_TEXT) {
    console.log("検索テキストを引数に入力してください。");
    process.exit(1);
}

const SEARCH_FOLDER_PATH = path.resolve(SEARCH_FOLDER_PATH_RAW);

console.log("検索中...");

/** @type { {name: string, path: string} } */
const foundedFiles = [];

readDirRecursive(SEARCH_FOLDER_PATH, (filePath, stat) => {
    const fileName = path.basename(filePath);

    if (check(fileName)) {
        foundedFiles.push({ "name": fileName, "path": filePath });
    }
}, async () => {
    if (foundedFiles.length <= 0) {
        console.log("見つかりませんでした");
        process.exit(1);
    }

    if (foundedFiles.length === 1) {
        const file = foundedFiles[0];

        console.log(`1個のファイルが見つかりました。`);
        console.log(`一つのため、自動で開きます。`);

        openFile(file.path);

        process.exit(0);
    } else {
        console.log(`${foundedFiles.length}個のファイルが見つかりました。`);

        const outputs = [];

        for (let i = 0; i < foundedFiles.length; i++) {
            const file = foundedFiles[i];

            outputs.push(`${i}: ${path.dirname(file.path.split("¥").slice(-1).join(""))}/${file.name}`);
        }

        console.log(outputs.join("\n"));
        console.log(`\n`);

        const index = await question("開きたいファイルの番号を入力してください: ");
        const file = foundedFiles[index];

        if (!file) {
            console.log("無効な番号です");
            process.exit(1);
        }

        openFile(file.path);
        process.exit(0);
    }
});

function openFile(filePath) {
    const fileName = path.basename(filePath);
    const ext = fileName.split(".")[1];

    if (!SUPPORTED_FILE_EXTENSIONS.includes(ext)) {
        console.log("未対応のファイルです。");
        process.exit(1);
    }

    switch (ext) {
        case "png":
            child.execSync(`start ${fileName}`, { "cwd": filePath.replace(fileName, "") });
            return;

        case "json":
            child.execSync(`notepad ${fileName}`, { "cwd": filePath.replace(fileName, "") });
            return;

        default:
            console.log("未対応のファイルです");
            return;
    }
}

async function question(question) {
    const rl = readline.createInterface({
        "input": process.stdin,
        "output": process.stdout
    });

    return await rl.question(question);
}

/**
 * 
 * @param { string } fileName
 * @returns { boolean } 
 */
function check(fileName) {
    return fileName.includes(SEARCH_TEXT);
}

/**
 * 
 * @param { string } dirPath 
 * @param { ({filePath: string, stat: fs.Stats}) => any } callback 
 * @param { any } onEnd
 */
async function readDirRecursive(dirPath, callback, onEnd) {
    if (fs.existsSync(dirPath) === false) {
        console.log(`${dirPath} は存在しません。`);
        process.exit(1);
    }

    const files = fs.readdirSync(dirPath);

    for await (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await readDirRecursive(filePath, callback, null);
        } else {
            callback(filePath, stat);
        }
    }

    if (onEnd !== null) onEnd();
}