const { Storage } = require('@google-cloud/storage');
const path = require('path');

// El bucket se activa sólo si GCS_BUCKET está definido. Las credenciales se toman de
// GOOGLE_APPLICATION_CREDENTIALS (ruta al JSON de la service account) vía ADC.
const BUCKET = process.env.GCS_BUCKET;

let bucket = null;
if (BUCKET) {
  const storage = new Storage();
  bucket = storage.bucket(BUCKET);
}

const gcsHabilitado = () => !!bucket;

// Sube el buffer de un archivo (multer memoryStorage) al bucket y devuelve su URL pública.
async function subirArchivo(file) {
  if (!bucket) throw new Error('GCS no está configurado');

  const nombreObjeto = `materials/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  const blob = bucket.file(nombreObjeto);

  await blob.save(file.buffer, {
    resumable: false,
    contentType: file.mimetype,
    metadata: { cacheControl: 'public, max-age=31536000' }
  });

  // Con acceso fino se puede hacer público el objeto; con acceso uniforme esto falla y
  // se asume que el bucket ya es público a nivel bucket (allUsers => Storage Object Viewer).
  try {
    await blob.makePublic();
  } catch {
    /* bucket con uniform bucket-level access: el acceso público se configura en el bucket */
  }

  return {
    url: `https://storage.googleapis.com/${BUCKET}/${nombreObjeto}`,
    nombreObjeto
  };
}

async function eliminarArchivo(publicUrl) {
  if (!bucket) return;
  const prefix = `https://storage.googleapis.com/${BUCKET}/`;
  if (!publicUrl.startsWith(prefix)) return;
  await bucket.file(publicUrl.slice(prefix.length)).delete({ ignoreNotFound: true });
}

module.exports = { gcsHabilitado, subirArchivo, eliminarArchivo };
