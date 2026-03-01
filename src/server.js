require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

/* ================= GEMINI AI ================= */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

app.post("/ai", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    //     const prompt = `You are a professional yoga instructor.
    // Give safe yoga advice.
    // Question: ${req.body.prompt}`;

    const systemPrompt = `
You are SANGAM AI Yoga Coach.

Rules:
- ALWAYS reply in bullet points.
- Maximum 6 bullets.
- Each bullet must be short.
- No paragraphs.
- No explanations.
- Sound like yoga instructor.
- Simple English.
- Add emoji.

Example format:

🧘 Today Yoga Plan:

• 5 Surya Namaskar  
• 10 Cat Cow  
• 30s Child Pose  
• 3 min Deep Breathing  

End with: "Tell me morning or evening?"

User says:
`;

     const result = await model.generateContent(systemPrompt + req.body.prompt);

    //   const result = await model.generateContent(prompt);
    //  console.log(result);

    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "AI Error" });
  }
});

/* ================= POSTGRES ================= */

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


/* ================= EMAIL ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================= FRONTEND ================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= CONTACT FORM ================= */

app.post("/contact", async (req, res) => {
  const { name, email, phone, purpose, message } = req.body;

  try {
    await pool.query(
      "INSERT INTO contacts(name,email,phone,purpose,message) VALUES($1,$2,$3,$4,$5)",
      [name, email, phone, purpose, message],
    );

    await transporter.sendMail({
      from: `"SANGAM Yoga" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: "New Contact Form Submission",
      html: `
      <h3>New Message Received</h3>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Purpose:</b> ${purpose}</p>
      <p><b>Message:</b> ${message}</p>
      `,
    });

    res.status(200).send("Success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🧘 SANGAM running at http://localhost:${PORT}`);
});
