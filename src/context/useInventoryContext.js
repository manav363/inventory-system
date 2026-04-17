import { useContext } from 'react';
import InventoryContext from './InventoryContext';

const useInventoryContext = () => useContext(InventoryContext);

export default useInventoryContext;
