import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DocumentPreview from './components/DocumentPreview';
import './App.css';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <DocumentPreview />
    </DndProvider>
  );
}

export default App;