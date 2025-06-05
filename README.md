# Web CAD Application

## Overview
This project is a web-based CAD application designed for educational purposes. It allows users to create and manipulate basic geometric shapes using a simple and intuitive interface.

## Features
- Drawing tools for lines, circles, and rectangles.
- Shape selection and manipulation.
- Zooming and panning capabilities for the canvas.
- A user-friendly toolbar and menu for easy access to tools and options.
- Property panel to view and edit selected shape attributes.

## Project Structure
```
web-cad-app
├── src
│   ├── index.html          # Main HTML document
│   ├── styles
│   │   └── main.css       # CSS styles for the application
│   ├── scripts
│   │   ├── app.js         # Application initialization and state management
│   │   ├── canvas
│   │   │   ├── renderer.js # Handles drawing shapes on the canvas
│   │   │   └── viewport.js # Manages the visible area of the canvas
│   │   ├── tools
│   │   │   ├── line.js     # Line drawing tool
│   │   │   ├── circle.js   # Circle drawing tool
│   │   │   ├── rectangle.js # Rectangle drawing tool
│   │   │   └── select.js    # Shape selection tool
│   │   ├── ui
│   │   │   ├── toolbar.js   # Toolbar UI setup
│   │   │   ├── menu.js      # Application menu setup
│   │   │   └── properties.js # Properties panel update
│   │   └── utils
│   │       ├── geometry.js   # Geometric utility functions
│   │       └── commands.js    # Command management functions
│   ├── assets
│   │   └── icons            # Icon assets for the UI
│   └── libs                 # Third-party libraries
└── README.md                # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the `index.html` file in a web browser to run the application.
3. Ensure that all necessary assets and libraries are included in the `src` directory.

## Usage Guidelines
- Use the toolbar to select drawing tools.
- Click and drag on the canvas to create shapes.
- Use the selection tool to manipulate existing shapes.
- Access the properties panel to edit attributes of selected shapes.

## Contributing
Feel free to contribute to this project by submitting issues or pull requests. Your feedback and suggestions are welcome!