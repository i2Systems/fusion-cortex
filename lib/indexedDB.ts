/**
 * IndexedDB Storage for Images
 * 
 * Provides IndexedDB storage for store-specific images.
 * Images are stored per store to support multi-store functionality.
 * 
 * AI Note: This is set up for future use. Currently, images are not
 * being stored, but the structure is ready when needed.
 */

const DB_NAME = 'fusion_storage'
const DB_VERSION = 2 // Increment for new object store
const STORE_NAME = 'images'
const VECTOR_STORE_NAME = 'vectorData'

export interface StoredImage {
  id: string
  storeId: string
  imageData: Blob
  mimeType: string
  filename: string
  uploadedAt: Date
  size: number
}

let dbInstance: IDBDatabase | null = null

/**
 * Initialize IndexedDB database
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create images object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        
        // Create indexes for efficient querying
        objectStore.createIndex('storeId', 'storeId', { unique: false })
        objectStore.createIndex('uploadedAt', 'uploadedAt', { unique: false })
      }
      
      // Create vector data object store if it doesn't exist
      if (!db.objectStoreNames.contains(VECTOR_STORE_NAME)) {
        const vectorStore = db.createObjectStore(VECTOR_STORE_NAME, { keyPath: 'id' })
        vectorStore.createIndex('storeId', 'storeId', { unique: false })
        vectorStore.createIndex('uploadedAt', 'uploadedAt', { unique: false })
      }
    }
  })
}

/**
 * Store an image for a specific store
 */
export async function storeImage(
  storeId: string,
  imageData: Blob,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const db = await initIndexedDB()
  const id = `${storeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const image: StoredImage = {
    id,
    storeId,
    imageData,
    mimeType,
    filename,
    uploadedAt: new Date(),
    size: imageData.size,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(image)

    request.onsuccess = () => {
      resolve(id)
    }

    request.onerror = () => {
      reject(new Error('Failed to store image'))
    }
  })
}

/**
 * Get an image by ID
 */
export async function getImage(imageId: string): Promise<StoredImage | null> {
  const db = await initIndexedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(imageId)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(new Error('Failed to get image'))
    }
  })
}

/**
 * Get all images for a specific store
 */
export async function getStoreImages(storeId: string): Promise<StoredImage[]> {
  const db = await initIndexedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('storeId')
    const request = index.getAll(storeId)

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject(new Error('Failed to get store images'))
    }
  })
}

/**
 * Delete an image
 */
export async function deleteImage(imageId: string): Promise<void> {
  const db = await initIndexedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(imageId)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to delete image'))
    }
  })
}

/**
 * Delete all images for a specific store
 */
export async function deleteStoreImages(storeId: string): Promise<void> {
  const db = await initIndexedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('storeId')
    const request = index.openCursor(IDBKeyRange.only(storeId))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }

    request.onerror = () => {
      reject(new Error('Failed to delete store images'))
    }
  })
}

/**
 * Get total storage size for a store (in bytes)
 */
export async function getStoreImageSize(storeId: string): Promise<number> {
  const images = await getStoreImages(storeId)
  return images.reduce((total, image) => total + image.size, 0)
}

/**
 * Store vector data for a specific store
 * Uses IndexedDB to handle large datasets that exceed localStorage limits
 */
export async function storeVectorData(
  storeId: string,
  vectorData: any,
  key: string
): Promise<void> {
  const db = await initIndexedDB()
  const id = `${storeId}-${key}`
  
  // Convert to JSON string and then to Blob for efficient storage
  const jsonString = JSON.stringify(vectorData)
  const blob = new Blob([jsonString], { type: 'application/json' })
  
  const data = {
    id,
    storeId,
    key,
    vectorData: blob,
    uploadedAt: new Date(),
    size: blob.size,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VECTOR_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(VECTOR_STORE_NAME)
    const request = store.put(data) // Use put to overwrite if exists

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to store vector data'))
    }
  })
}

/**
 * Get vector data by store ID and key
 */
export async function getVectorData(
  storeId: string,
  key: string
): Promise<any | null> {
  const db = await initIndexedDB()
  const id = `${storeId}-${key}`

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VECTOR_STORE_NAME], 'readonly')
    const store = transaction.objectStore(VECTOR_STORE_NAME)
    const request = store.get(id)

    request.onsuccess = async () => {
      const result = request.result
      if (!result) {
        resolve(null)
        return
      }
      
      // Convert Blob back to JSON
      try {
        const text = await result.vectorData.text()
        const vectorData = JSON.parse(text)
        resolve(vectorData)
      } catch (error) {
        reject(new Error('Failed to parse vector data'))
      }
    }

    request.onerror = () => {
      reject(new Error('Failed to get vector data'))
    }
  })
}

/**
 * Delete vector data for a specific store and key
 */
export async function deleteVectorData(
  storeId: string,
  key: string
): Promise<void> {
  const db = await initIndexedDB()
  const id = `${storeId}-${key}`

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VECTOR_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(VECTOR_STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to delete vector data'))
    }
  })
}

