import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkTickets() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const totalTickets = await db.collection('tickets').countDocuments();
    console.log(`\nTotal tickets in database: ${totalTickets}`);

    if (totalTickets > 0) {
      const tickets = await db.collection('tickets').find({}).limit(5).toArray();
      console.log('\nSample tickets:');
      tickets.forEach((t: any) => {
        console.log(`  - ID: ${t._id}`);
        console.log(`    Ticket#: ${t.ticketId || 'N/A'}`);
        console.log(`    Title: ${t.title || 'No title'}`);
        console.log(`    Status: ${t.status || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No tickets found in database!');
      console.log('This might be why the ticket details page is not loading.');
      console.log('Try creating a ticket first from the UI.');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTickets();
