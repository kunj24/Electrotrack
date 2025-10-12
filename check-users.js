import { getDb } from './lib/mongodb.js'

async function checkUsers() {
  try {
    const db = await getDb()
    const userCount = await db.collection('users').countDocuments()
    console.log('Total users in database:', userCount)

    // Also list a few users if any
    const users = await db.collection('users').find({}).limit(5).toArray()
    console.log('Sample users:', users.map(u => ({ email: u.email, name: u.name })))
  } catch (error) {
    console.error('Error:', error)
  }
}

checkUsers()