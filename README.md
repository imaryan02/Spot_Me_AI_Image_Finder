# EventMatch - AI Photo Finder

EventMatch is a powerful, privacy-focused client-side application that helps users find photos of themselves in large event galleries using AI face recognition. 

Built with **React 19**, **TypeScript**, and **face-api.js**, this application runs face detection and recognition entirely in your browser, ensuring your biometric data never leaves your device.

![EventMatch Banner](https://via.placeholder.com/1200x400?text=EventMatch+AI+Photo+Finder)

## 🚀 Key Features

*   **Client-Side AI**: Uses `face-api.js` to perform face detection and matching locally.
*   **Multiple Sources**:
    *   📂 **Local Files**: Select a folder from your device.
    *   ☁️ **Google Drive**: Connect to a Google Drive folder (requires API Key).
    *   🌐 **Web JSON**: Load photos from a remote JSON manifest.
*   **Privacy First**: Your face descriptor is generated in memory and never stored or sent to a server.
*   **Smart Filtering**: Automatically filters thousands of photos to find matches with high accuracy.
*   **Responsive Design**: Beautiful, dark-themed UI built with Tailwind CSS.

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS (via CDN for rapid prototyping)
*   **AI/ML**: face-api.js (SSD Mobilenet v1 model)
*   **State Management**: React Hooks (useState, useEffect)

## 📋 Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

## ⚡ Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/eventmatch.git
    cd eventmatch
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## ⚙️ Configuration

To use the Google Drive integration, you need to provide your API Key and Folder ID. You can set these in the UI or hardcode them in `constants.ts` for a specific deployment.

### Environment Variables (Optional)
You can create a `.env` file in the root directory to pre-fill configuration:

```env
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_FOLDER_ID=your_folder_id_here
```

## 📖 Usage Guide

1.  **Select Source**: Choose where your photos are located (Local, Drive, or Web).
2.  **Load Gallery**: The app will index the photos. For large galleries, this might take a moment.
3.  **Scan Face**: Click "Find My Photos" and allow camera access.
4.  **View Results**: The app will scan the gallery and display photos where you appear.

## 📂 Project Structure

```
eventmatch/
├── components/         # UI Components (FaceScanner, Gallery, etc.)
├── services/          # Logic for Face API, Drive, and Web fetching
├── App.tsx            # Main application logic
├── constants.ts       # Configuration constants
├── types.ts           # TypeScript interfaces
└── index.html         # Entry point (Tailwind & face-api.js loaded here)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
