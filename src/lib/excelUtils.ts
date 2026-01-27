import * as XLSX from 'xlsx';
import type { Dish } from '@/hooks/useDishes';

interface FullMenuData {
  restaurant: any;
  categories: Array<{
    id: string;
    name: string;
    subcategories: Array<{
      id: string;
      name: string;
      dishes: Dish[];
    }>;
  }>;
}

/**
 * Export full menu to Excel file
 */
export const exportMenuToExcel = (menuData: FullMenuData, restaurantName: string) => {
  const rows: any[] = [];

  // Flatten the menu structure into rows
  menuData.categories?.forEach((category) => {
    category.subcategories?.forEach((subcategory) => {
      subcategory.dishes?.forEach((dish) => {
        rows.push({
          Category: category.name,
          Subcategory: subcategory.name,
          Name: dish.name,
          Description: dish.description || '',
          Price: dish.price,
          Calories: dish.calories || '',
          Allergens: dish.allergens?.join(', ') || '',
          Vegetarian: dish.is_vegetarian ? 'Yes' : 'No',
          Vegan: dish.is_vegan ? 'Yes' : 'No',
          Spicy: dish.is_spicy ? 'Yes' : 'No',
          New: dish.is_new ? 'Yes' : 'No',
          Special: dish.is_special ? 'Yes' : 'No',
          Popular: dish.is_popular ? 'Yes' : 'No',
          "Chef's Pick": dish.is_chef_recommendation ? 'Yes' : 'No',
        });
      });
    });
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Category
    { wch: 20 }, // Subcategory
    { wch: 30 }, // Name
    { wch: 50 }, // Description
    { wch: 10 }, // Price
    { wch: 10 }, // Calories
    { wch: 30 }, // Allergens
    { wch: 10 }, // Vegetarian
    { wch: 10 }, // Vegan
    { wch: 10 }, // Spicy
    { wch: 10 }, // New
    { wch: 10 }, // Special
    { wch: 10 }, // Popular
    { wch: 12 }, // Chef's Pick
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Menu');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${restaurantName.replace(/[^a-zA-Z0-9]/g, '_')}_menu_${date}.xlsx`;

  // Download the file
  XLSX.writeFile(wb, filename);
};

/**
 * Parse Excel file and return data for import preview
 */
export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generate a template Excel file for importing dishes
 */
export const downloadImportTemplate = () => {
  const templateData = [
    {
      Category: 'Appetizers',
      Subcategory: 'Starters',
      Name: 'Example Dish',
      Description: 'A delicious example dish',
      Price: '12.99',
      Calories: 350,
      Allergens: 'gluten, dairy',
      Vegetarian: 'No',
      Vegan: 'No',
      Spicy: 'Yes',
      New: 'Yes',
      Special: 'No',
      Popular: 'Yes',
      "Chef's Pick": 'No',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 50 },
    { wch: 10 },
    { wch: 10 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'menu_import_template.xlsx');
};
