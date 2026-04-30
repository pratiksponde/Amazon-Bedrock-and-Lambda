import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const s3 = new S3Client({});
const bedrock = new BedrockRuntimeClient({ region: "eu-north-1" });

// Get file from S3
const getFile = async (bucket, key) => {
    const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const chunks = [];
    for await (const chunk of data.Body) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

// Validate image
const validateImage = (buffer, key) => {
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!buffer || buffer.length === 0) {
        throw new Error(`Empty file: ${key}`);
    }

    if (buffer.length > maxSize) {
        throw new Error(`File too large: ${key}`);
    }

    if (!key.match(/\.(png|jpg|jpeg)$/i)) {
        throw new Error(`Unsupported file type: ${key}`);
    }
};

// Media type
const getMediaType = (key) => {
    if (key.toLowerCase().endsWith(".png")) return "image/png";
    return "image/jpeg";
};

export const handler = async (event) => {
    console.log("EVENT:", JSON.stringify(event, null, 2));

    let bucket, targetKey;

    try {
        // ✅ Handle S3 trigger
        if (event.Records && event.Records.length > 0) {
            const record = event.Records[0];
            bucket = record.s3.bucket.name;
            targetKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
        }
        // ✅ Handle manual test
        else {
            bucket = event.bucket;
            targetKey = event.targetFile;
        }

        if (!bucket || !targetKey) {
            throw new Error("Missing bucket or targetKey");
        }

        console.log("Processing file:", targetKey);

        // Only process target-files/
        if (!targetKey.startsWith("target-files/")) {
            console.log("Skipping non-target file");
            return { statusCode: 200, body: "Skipped" };
        }

        const refKey = "reference-images/Reference-Image.png";

        // Fetch files
        const refImage = await getFile(bucket, refKey);
        const targetImage = await getFile(bucket, targetKey);

        // Validate
        validateImage(refImage, refKey);
        validateImage(targetImage, targetKey);

        // Prepare payload
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 50,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Check if the reference image exists in the target image.
Return ONLY true or false.
Consider rotation, scaling, cropping, partial visibility.`
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: getMediaType(refKey),
                                data: refImage.toString("base64")
                            }
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: getMediaType(targetKey),
                                data: targetImage.toString("base64")
                            }
                        }
                    ]
                }
            ]
        };

        // Call Bedrock
        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-sonnet-4-5-20250929-v1:0",
            body: JSON.stringify(payload),
            contentType: "application/json"
        });

        const response = await bedrock.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.body));

        const outputText = result.content?.[0]?.text?.toLowerCase() || "false";
        const isMatch = outputText.includes("true");

        console.log("Match result:", isMatch);

        // Store result in S3
        const resultKey = `results/${Date.now()}-result.json`;

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: resultKey,
            Body: JSON.stringify({
                targetFile: targetKey,
                referenceFile: refKey,
                match: isMatch,
                modelOutput: outputText
            }),
            ContentType: "application/json"
        }));

        console.log("Result stored at:", resultKey);

        return {
            statusCode: 200,
            body: {
                match: isMatch,
                resultLocation: resultKey
            }
        };

    } catch (error) {
        console.error("ERROR:", error);

        return {
            statusCode: 500,
            body: {
                error: error.message
            }
        };
    }
};