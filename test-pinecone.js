import { Pinecone } from "@pinecone-database/pinecone"

const client = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

async function run() {
  try {
    console.log("Listing indexes...")
    const list = await client.listIndexes()
    console.log(list)
  } catch (err) {
    console.error("Error talking to Pinecone:", err.message)
  }
}

run()
