const { MongoClient } = require('mongodb');

async function removeSkuFromCollections() {
  const uri = 'mongodb://localhost:27017/electrotrack';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('electrotrack');
    const productsCollection = database.collection('products');
    const inventoryCollection = database.collection('inventory');

    // Remove SKU from products collection
    console.log('Removing SKU from products collection...');
    const productsResult = await productsCollection.updateMany(
      { sku: { $exists: true } },
      { $unset: { sku: 1 } }
    );
    console.log(`Updated ${productsResult.modifiedCount} products, removed SKU field`);

    // Remove SKU from inventory collection
    console.log('Removing SKU from inventory collection...');
    const inventoryResult = await inventoryCollection.updateMany(
      { sku: { $exists: true } },
      { $unset: { sku: 1 } }
    );
    console.log(`Updated ${inventoryResult.modifiedCount} inventory items, removed SKU field`);

    console.log('SKU removal completed successfully');

  } catch (error) {
    console.error('Error removing SKU:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

removeSkuFromCollections();
