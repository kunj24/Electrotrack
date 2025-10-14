const { MongoClient } = require('mongodb');

async function syncProductsToInventory() {
  const uri = 'mongodb://localhost:27017/electrotrack';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('electrotrack');
    const productsCollection = database.collection('products');
    const inventoryCollection = database.collection('inventory');

    // Get all active products
    const products = await productsCollection.find({
      deletedAt: { $exists: false },
      status: { $ne: 'archived' }
    }).toArray();

    console.log(`Found ${products.length} active products to sync`);

    let updated = 0;
    let created = 0;

    for (const product of products) {
      // Check if inventory record exists
      const existingInventory = await inventoryCollection.findOne({ name: product.name });

      // Prepare inventory data (exclude product-specific fields)
      const inventoryData = {
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        description: product.description,
        images: product.images,
        quantity: product.quantity,
        status: product.status === 'active' ? 'active' : 'inactive',
        updatedAt: new Date(),
        updatedBy: 'sync'
      };

      if (existingInventory) {
        // Update existing inventory record
        await inventoryCollection.updateOne(
          { name: product.name },
          { $set: inventoryData }
        );
        updated++;
      } else {
        // Create new inventory record with default inventory fields
        const newInventoryData = {
          ...inventoryData,
          minStockLevel: 10,
          maxStockLevel: 100,
          isFeatured: product.isFeatured || false,
          rating: 0,
          reviews: 0,
          createdAt: new Date(),
          createdBy: 'sync',
          location: 'Warehouse A',
          supplier: product.brand || 'Unknown',
          reorderPoint: 10,
          lastRestocked: new Date(),
          expiryDate: null,
          barcode: `AUTO-${Date.now()}`
        };
        await inventoryCollection.insertOne(newInventoryData);
        created++;
      }
    }

    console.log(`Sync completed: ${updated} updated, ${created} created`);

    // Remove inventory records for deleted/archived products
    const deletedProducts = await productsCollection.find({
      $or: [
        { deletedAt: { $exists: true } },
        { status: 'archived' }
      ]
    }).toArray();

    if (deletedProducts.length > 0) {
      const deletedNames = deletedProducts.map(p => p.name);
      const deleteResult = await inventoryCollection.deleteMany({
        name: { $in: deletedNames }
      });
      console.log(`Removed ${deleteResult.deletedCount} inventory records for deleted/archived products`);
    }

  } catch (error) {
    console.error('Error syncing products to inventory:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

syncProductsToInventory();