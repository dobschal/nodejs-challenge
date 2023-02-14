import { createDecipheriv } from "crypto";
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from "fs";
import { pipeline } from "stream";
import { createUnzip } from "zlib";

(async function () {
    decryptTofile("decrypted.zip");
    await unpackFile("decrypted.zip", "decrypted.txt");
    sumIt("decrypted.txt");
})();

function decryptTofile(filename: string) {
    console.log("Decrypt file...");
    const t1 = Date.now();
    const encryptedContent = readFileSync("secret.enc");
    const algorithm = "aes-256-gcm";
    const key = readFileSync("secret.key", "utf-8").substring(0, 32);
    const iv = readFileSync("iv.txt");
    const authTag = readFileSync("auth.txt");

    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const output = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
    writeFileSync(filename, output);
    console.log(`Decrypt done in ${Date.now() - t1}ms.`);
}

function unpackFile(filename, outputFileName): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("Unzip file...");
        const t1 = Date.now();
        const unzip = createUnzip();
        const inputStream = createReadStream(filename);
        const outputStream = createWriteStream(outputFileName);
        pipeline(inputStream, unzip, outputStream, (error) => {
            if (error) return reject(error);
            resolve();
            console.log(`Unzipped file in ${Math.floor((Date.now() - t1) / 1000)}sec`);
        });
    });
}

function sumIt(filename: string) {
    console.log("Start summing...");
    const t1 = Date.now();
    const readStream = createReadStream(filename);
    let sum = 0;

    const interval = setInterval(() => {
        console.log("Sum: ", sum);
    }, 1000);

    readStream.on('data', chunk => {
        const str = chunk.toString("utf8");
        const sumInChunk = str
            .match(/[\daioeuAUOEI]/g)
            ?.map(letter => {
                switch (letter) {
                    case "a": case "A": return 2;
                    case "e": case "E": return 4;
                    case "i": case "I": return 8;
                    case "o": case "O": return 16;
                    case "u": case "U": return 32;
                    default: return Number(letter);
                }
            })
            .reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0
            ) ?? 0;
        sum += sumInChunk;
    });

    readStream.on('open', () => {
        console.log('Stream open...');
    });

    readStream.on('end', () => {
        console.log(`Summing done in ${Math.floor((Date.now() - t1) / 1000)}sec`, sum);
        clearInterval(interval);
    });
}