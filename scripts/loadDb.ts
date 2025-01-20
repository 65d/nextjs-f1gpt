import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"


type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY } = process.env

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

const f1Data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.espn.com/f1/story/_/id/43395503/formula-1-2025-car-launch-dates-full-season-calendar',
    'https://www.formula1.com',
    'https://www.skysports.com/f1',
    'https://www.statsf1.com/en/default.aspx',
    'https://www.statsf1.com/en/2025.aspx',
    'https://www.reuters.com/sports/formula1/formula-one-statistics-mexico-city-grand-prix-2024-10-23/',
    'https://www.formula1.com/en/latest/article/facts-and-stats-verstappen-breaks-schumacher-record-for-longest-stint-as.4JGyIPJdWP8RTZLVgNt3WO',
    'https://www.autosport.com/f1/news/why-bearmans-ferrari-debut-and-the-phone-data-disaster-that-preceded-matters-for-f1-2025/10688718/'
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE})
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for (const url of f1Data) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks) {
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            })

            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })

            console.log(res)
        }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })

    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}

createCollection().then(() => loadSampleData())