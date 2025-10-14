const { MongoClient } = require('mongodb');

async function syncInventoryWithProducts() {
  const uri = 'mongodb://localhost:27017/electrotrack';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('electrotrack');
    const productsCollection = database.collection('products');
    const inventoryCollection = database.collection('inventory');

    // Find all soft-deleted products
    const deletedProducts = await productsCollection.find({
      deletedAt: { $exists: true }
    }, { sku: 1 }).toArray();

    console.log(`Found ${deletedProducts.length} soft-deleted products`);

    if (deletedProducts.length > 0) {
      // Get SKUs of deleted products
      const deletedSKUs = deletedProducts.map(product => product.sku);
      console.log('Deleted SKUs:', deletedSKUs);

      // Remove inventory records for deleted products
      const deleteResult = await inventoryCollection.deleteMany({
        sku: { $in: deletedSKUs }
      });

      console.log(`Removed ${deleteResult.deletedCount} inventory records for deleted products`);
    }

    // Verify final counts
    const activeProductsCount = await productsCollection.countDocuments({
      deletedAt: { $exists: false }
    });
    const inventoryCount = await inventoryCollection.countDocuments();

    console.log(`Active products: ${activeProductsCount}`);
    console.log(`Inventory records: ${inventoryCount}`);

  } catch (error) {
    console.error('Error syncing inventory:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

syncInventoryWithProducts();
