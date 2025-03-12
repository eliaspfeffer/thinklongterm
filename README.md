# ThinkLongTerm

![ThinkLongTerm Logo](public/logo.png)

ThinkLongTerm is a decision tree visualization tool that helps you map out complex decisions and their potential outcomes. By visualizing the branching paths of different choices, it enables you to think more strategically about long-term consequences.

## Features

- **Interactive Decision Tree**: Create and visualize hierarchical decision trees
- **Node Management**: Add, edit, and delete decision nodes
- **Detailed Information**: Add descriptions and timeframes to each decision
- **Tree Navigation**: Easily navigate through your decision tree
- **History Management**: Undo and redo functionality for tree changes
- **Local Storage**: Your decision trees are saved locally in your browser

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/thinklongterm.git
   cd thinklongterm
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## How to Use

### Creating a New Decision Tree

1. When you first open the application, a new tree with a root node will be created automatically
2. Click on the root node to select it
3. The node details panel will open on the bottom of the screen

### Adding Decision Branches

1. Select a node by clicking on it
2. Hover over the node to see the green "+" button
3. Click the "+" button to add a new child node
4. Fill out the form with the decision details:
   - **Label**: A short name for the decision
   - **Description**: More detailed information about this decision
   - **Timeframe**: When this decision might occur (e.g., "Short-term", "1 year", "5 years")
5. Click "Add" to create the new decision branch

### Editing and Deleting Nodes

1. Select a node by clicking on it
2. Click "Edit" to modify the node's details
3. Click "Delete" to remove the node and all its children

### Navigating the Tree

- Pan: Click and drag on the empty space
- Zoom: Use mouse wheel or pinch gestures
- Select: Click on any node to view or edit its details

## Project Structure

- `src/components/tree/`: Contains the tree visualization components
- `src/context/`: Contains the React context for state management
- `src/utils/`: Contains utility functions for tree manipulation
- `src/types/`: Contains TypeScript type definitions

## Technologies Used

- React.js
- Next.js
- TypeScript
- react-d3-tree
- TailwindCSS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need to visualize complex decision-making processes
- Built with the goal of helping people think more strategically about their futures
