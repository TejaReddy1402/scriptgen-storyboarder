# 🎬 ScriptGenAI: Cinematic Storyboarder

> **An intelligent visualizer that bridges the gap between text and image.**

ScriptGenAI automates the pre-production process by combining the reasoning capabilities of **Google Gemini 2.0** with the photorealistic image generation power of **Flux Realism**. It parses raw screenplays, understands cinematic context, and renders consistent, high-fidelity storyboard panels.

---

## ✨ Key Features

* **🧠 Intelligent Script Analysis**
    Automatically parses scene headers, action lines, and dialogue to understand the narrative context and emotional tone of the scene.

* **📸 Photorealistic Generation**
    Powered by the **Flux Realism** model (via Pollinations.ai) to generate cinema-quality images. No cartoons or anime styles—just raw, cinematic visualization.

* **wx Character Consistency**
    Upload a reference photo to maintain visual consistency for your main characters across different shots and angles.

* **ZT Cinematic Shot Logic**
    The AI acts as a cinematographer, automatically determining the best camera angles (Wide, Close-up, Dutch Angle) and lighting setups based on the script's action.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, TypeScript
* **Styling:** Tailwind CSS
* **AI Logic:** Google GenAI SDK (Gemini 2.0 Flash)
* **Image Generation:** Pollinations.ai API (Flux Realism)

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn
* A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/TejaReddy1402/scriptgen-storyboarder.git](https://github.com/TejaReddy1402/scriptgen-storyboarder.git)
    cd scriptgen-storyboarder
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open your browser to `http://localhost:3000` (or the port shown in your terminal).

---

## 📖 How to Use

1.  **Input Script:** Paste your screenplay scene into the text editor (standard screenplay format is recommended).
2.  **Upload Reference (Optional):** Upload a photo of an actor or prop to ensure the AI keeps the look consistent.
3.  **Generate:** Click the "Generate Storyboard" button.
    * *Step 1:* Gemini 2.0 analyzes the text and breaks it into shot descriptions.
    * *Step 2:* Flux Realism generates images for each shot based on those descriptions.
4.  **Refine:** If a specific shot isn't right, click the "Regenerate" button on that specific card to try a new variation.

---
