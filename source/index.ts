import { createDecipheriv } from "crypto";
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from "fs";
import { createServer } from "http";
import { pipeline } from "stream";
import { createUnzip } from "zlib";

(async function () {

    // Aufgabe 4
    startServer();

    // Aufgabe 1
    decryptTofile("decrypted.zip");
    await unpackFile("decrypted.zip", "decrypted.txt");

    // Aufgabe 2 und 3
    await sumIt("decrypted.txt");

    // Aufgabe 4
    await sumPerSentence("decrypted.txt");
})();

// Aufgabe 1
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

// Aufgabe 1
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

// Aufgabe 2 und 3
function sumIt(filename: string): Promise<void> {
    return new Promise((resolve) => {
        console.log("Start summing...");
        const t1 = Date.now();
        const readStream = createReadStream(filename);
        let sum = 0;

        const interval = setInterval(() => {
            console.log("Sum: ", sum);
        }, 1000);

        readStream.on('data', (chunk: Buffer) => {
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
            resolve();
        });
    });
}

// Aufgabe 4... 
function sumPerSentence(filename: string): Promise<void> {
    return new Promise((resolve) => {
        console.log("Start summing sum in sentences...");
        const t1 = Date.now();
        const readStream = createReadStream(filename);
        const sumPerSentence = [0];

        const interval = setInterval(() => {
            console.log("Sentences: ", sumPerSentence.length, sumPerSentence[sumPerSentence.length - 1]);
        }, 1000);

        readStream.on('data', (chunk: Buffer) => {
            const str = chunk.toString("utf8");
            str.split(".").forEach((str, index) => {
                if (index > 0) {
                    sumPerSentence.push(0);
                }
                const sumInChunk = str
                    .match(/\d/g)
                    ?.map(n => Number(n))
                    .reduce(
                        (accumulator, currentValue) => accumulator + currentValue,
                        0
                    ) ?? 0;
                sumPerSentence[sumPerSentence.length - 1] += sumInChunk;
            });
        });

        readStream.on('open', () => {
            console.log('Stream open...');
        });

        readStream.on('end', () => {
            console.log(`Summing sum in sentences done in ${Math.floor((Date.now() - t1) / 1000)}sec. Sentences: `, sumPerSentence.length);
            console.log("Sum per sentences: ", sumPerSentence);
            clearInterval(interval);

            const tenGreatestValues: number[] = [];

            sumPerSentence.forEach(sum => {
                tenGreatestValues.sort((a, b) => b - a);
                if (tenGreatestValues.length < 10) {
                    tenGreatestValues.push(sum);
                } else if (tenGreatestValues.some(v => v < sum)) {
                    tenGreatestValues.pop();
                    tenGreatestValues.push(sum);
                }
            });
            console.log("Ten largest values: ", tenGreatestValues);

            const tenGreatestOrdered = sumPerSentence.filter(s => tenGreatestValues.some(t => t <= s));

            const tenGreatestValuesMinusIndex = tenGreatestOrdered.map((t, index) => t - index);
            console.log("Ten largest values minus index: ", tenGreatestValuesMinusIndex);

            console.log("Word: ", String.fromCharCode(...tenGreatestValuesMinusIndex));

            resolve();
        });
    });
}

function startServer() {
    const word = "nodejs@red"; // from "Aufgabe 4"
    const port = 3000;
    const host = "localhost";

    const requestListener = function (req, res) {
        res.writeHead(200);
        res.end("Code: " + word);
    };

    const server = createServer(requestListener);
    server.listen(port, host, () => {
        console.log(`Server is providing code word on http://${host}:${port}`);
    });
}