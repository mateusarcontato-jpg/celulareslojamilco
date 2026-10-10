import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Device } from '../types/device';
import { INITIAL_DEVICES } from '../data/initialData';

const DEVICES_COLLECTION = 'devices';

/**
 * Sanitiza recursivamente objetos removendo campos com valor `undefined`
 * O Firestore rejeita expressamente qualquer payload contendo valores `undefined`.
 */
export function sanitizeDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeDataForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) {
        continue; // Ignora chaves com undefined
      }
      cleaned[key] = sanitizeDataForFirestore(val);
    }
    return cleaned as T;
  }

  return data;
}

/**
 * Inscreve-se nas atualizações em tempo real do Firestore para os celulares da Amilco
 */
export function subscribeToDevices(
  onDevicesUpdate: (devices: Device[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, DEVICES_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      // Se a coleção estiver vazia no primeiro carregamento do Firestore, inicializa com a base oficial de 35 aparelhos
      if (snapshot.empty) {
        console.log('[Firebase] Coleção vazia. Semeando a base oficial de 35 aparelhos Amilco no Firestore...');
        try {
          await seedInitialDevices();
        } catch (seedErr) {
          console.error('[Firebase] Erro ao semear dados no Firestore:', seedErr);
        }
        return;
      }

      const devicesList: Device[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        devicesList.push({
          ...data,
          id: docSnap.id,
          isPersonalDevice: Boolean(data.isPersonalDevice),
          hasVpn: Boolean(data.hasVpn),
          hasAssetTag: data.hasAssetTag !== false && data.assetNumber !== 'SEM PT',
          occurrences: Array.isArray(data.occurrences) ? data.occurrences : [],
          accessories: Array.isArray(data.accessories) ? data.accessories : [],
          signedTerms: Array.isArray(data.signedTerms) ? data.signedTerms : [],
        } as Device);
      });

      onDevicesUpdate(devicesList);
    },
    (error) => {
      console.error('[Firebase] Erro ao escutar coleção de dispositivos:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, DEVICES_COLLECTION);
    }
  );

  return unsubscribe;
}

/**
 * Salva ou atualiza um dispositivo no Firestore com sanitização garantida
 */
export async function saveDeviceToFirestore(device: Device): Promise<void> {
  const docRef = doc(db, DEVICES_COLLECTION, device.id);
  const now = new Date().toISOString();

  const rawData: Record<string, any> = {
    ...device,
    isPersonalDevice: Boolean(device.isPersonalDevice),
    hasVpn: Boolean(device.hasVpn),
    hasAssetTag: Boolean(device.hasAssetTag),
    updatedAt: now,
  };

  const dataToSave = sanitizeDataForFirestore(rawData);

  try {
    await setDoc(docRef, dataToSave, { merge: true });
    console.log(`[Firebase] Aparelho ${device.id} (${device.employeeName}) salvo com sucesso no Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Falha ao salvar aparelho ${device.id}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${DEVICES_COLLECTION}/${device.id}`);
  }
}

/**
 * Remove um dispositivo do Firestore
 */
export async function deleteDeviceFromFirestore(deviceId: string): Promise<void> {
  const docRef = doc(db, DEVICES_COLLECTION, deviceId);
  try {
    await deleteDoc(docRef);
    console.log(`[Firebase] Aparelho ${deviceId} excluído com sucesso do Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Falha ao excluir aparelho ${deviceId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${DEVICES_COLLECTION}/${deviceId}`);
  }
}

/**
 * Semeia a base oficial dos 35 celulares no Firestore
 */
export async function seedInitialDevices(): Promise<void> {
  const batch = writeBatch(db);
  for (const device of INITIAL_DEVICES) {
    const docRef = doc(db, DEVICES_COLLECTION, device.id);
    const sanitized = sanitizeDataForFirestore({
      ...device,
      isPersonalDevice: Boolean(device.isPersonalDevice),
      hasVpn: Boolean(device.hasVpn),
      hasAssetTag: Boolean(device.hasAssetTag),
    });
    batch.set(docRef, sanitized, { merge: true });
  }
  try {
    await batch.commit();
    console.log('[Firebase] Base oficial de 35 celulares sincronizada com sucesso no Firestore.');
  } catch (error) {
    console.error('[Firebase] Erro ao sincronizar lote inicial no Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, DEVICES_COLLECTION);
  }
}

/**
 * Importa múltiplos dispositivos em lote para o Firestore
 */
export async function importBatchDevicesToFirestore(devices: Device[]): Promise<void> {
  const batch = writeBatch(db);
  for (const device of devices) {
    const docRef = doc(db, DEVICES_COLLECTION, device.id);
    const sanitized = sanitizeDataForFirestore({
      ...device,
      isPersonalDevice: Boolean(device.isPersonalDevice),
      hasVpn: Boolean(device.hasVpn),
      hasAssetTag: Boolean(device.hasAssetTag),
    });
    batch.set(docRef, sanitized, { merge: true });
  }
  try {
    await batch.commit();
    console.log(`[Firebase] Lote de ${devices.length} celulares sincronizado com sucesso.`);
  } catch (error) {
    console.error('[Firebase] Erro na importação em lote:', error);
    handleFirestoreError(error, OperationType.WRITE, DEVICES_COLLECTION);
  }
}
