import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Device, DeviceOccurrence } from '../types/device';
import { INITIAL_DEVICES } from '../data/initialData';

const DEVICES_COLLECTION = 'devices';

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
        console.log('Coleção Firestore vazia. Semeando a base oficial de 35 aparelhos Amilco...');
        try {
          await seedInitialDevices();
        } catch (seedErr) {
          console.error('Erro ao semear dados no Firestore:', seedErr);
        }
        return;
      }

      const devicesList: Device[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        devicesList.push({
          ...data,
          id: docSnap.id,
          occurrences: Array.isArray(data.occurrences) ? data.occurrences : [],
        } as Device);
      });

      onDevicesUpdate(devicesList);
    },
    (error) => {
      console.error('Erro ao escutar coleção de dispositivos:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, DEVICES_COLLECTION);
    }
  );

  return unsubscribe;
}

/**
 * Salva ou atualiza um dispositivo no Firestore
 */
export async function saveDeviceToFirestore(device: Device): Promise<void> {
  const docRef = doc(db, DEVICES_COLLECTION, device.id);
  const now = new Date().toISOString();

  const dataToSave = {
    ...device,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
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
  } catch (error) {
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
    batch.set(docRef, device);
  }
  try {
    await batch.commit();
    console.log('Base de 35 celulares sincronizada com sucesso no Firestore.');
  } catch (error) {
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
    batch.set(docRef, device, { merge: true });
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DEVICES_COLLECTION);
  }
}
