const { MongoClient } = require('mongodb');

async function updateLowStock() {
  const client = new MongoClient('mongodb://localhost:27017/electrotrack');
  try {
    await client.connect();
    const db = client.db('electrotrack');
    const inventory = db.collection('inventory');

    // Set one product to low stock for testing
    const result = await inventory.updateOne(
      { name: 'Usha Mist Air Icy 400mm Table Fan' },
      { $set: { quantity: 3 } }
    );
    console.log('Updated product stock to 3:', result.modifiedCount);

    // Set another product to exactly 5 stock for testing
    const result2 = await inventory.updateOne(
      { name: 'Blue Star 1.5 Ton 5 Star Window AC' },
      { $set: { quantity: 5 } }
    );
    console.log('Updated product stock to 5:', result2.modifiedCount);

    const product2 = await inventory.findOne({ name: 'Blue Star 1.5 Ton 5 Star Window AC' });
    console.log('Updated product:', product2.name, 'quantity:', product2.quantity);
  } finally {
    await client.close();
  }
}

updateLowStock();