# Intelligent Image Presence Detection using AWS Bedrock


Detect whether a reference image exists inside a target document (image) using AI-powered visual reasoning with AWS services.

This project goes beyond traditional OCR by identifying images even if they are:

- Rotated 
- Resized 
- Partially visible 
- Positioned anywhere

📖 **Full article:**  
https://dev.to/pratik_26/amazon-bedrock-image-analysis-tutorial-with-aws-lambda-4mi9

---

# 🚀 Architecture

This solution uses:

- Amazon S3 – Store reference and target files
- AWS Lambda – Process and orchestrate logic
- Amazon Bedrock – Perform multimodal AI analysis

🔄 Flow

User → Upload to S3 → S3 Event → Lambda → Bedrock → Result Store in S3 Bucket (true/false)

---

# Features
- Detect image presence inside documents
- Supports images and PDFs
- Works with rotated, scaled, or partial matches
- Fully serverless and scalable
- Uses multimodal AI (no traditional CV required)

---

# Tech Stack
- Node.js (AWS Lambda)
- AWS SDK v3
- Amazon Bedrock (Claude Vision / Multimodal Model)
- Amazon S3

---

# 📂 Project Structure
```text
.
├── lambda/
│   └── index.js
├── sample/
│   ├── reference-image.png
│   └── target-file.pdf
├── README.md
```
---

# Sample Response
{
  "result": "true"
}

---

# Conclusion

This project demonstrates how to use multimodal AI to solve problems beyond OCR by enabling visual understanding inside documents.

---

# 👨‍💻 Author
**Pratik Ponde**  
Cloud & DevOps Engineer  

Article:
https://dev.to/pratik_26/amazon-bedrock-image-analysis-tutorial-with-aws-lambda-4mi9

---

# ⭐ Support

If you found this helpful:

- Star this repository
- Fork this repository
- Contribute improvements

