import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  initializeFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  CropPlanRecord,
  CropScanLogRecord,
  MarketplaceListing,
  MarketplaceOrderRecord,
} from '../types/agri';

export const WORKSPACE_SCOPES: string[] = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.acls',
  'https://www.googleapis.com/auth/calendar.acls.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.calendars',
  'https://www.googleapis.com/auth/calendar.calendars.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/calendar.events.public.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.settings.readonly',
];

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of WORKSPACE_SCOPES) {
  provider.addScope(scope);
}

// Strict in-memory token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(attempt = 1): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      if (attempt < 2) {
        setTimeout(() => {
          void testConnection(attempt + 1);
        }, 1500);
        return;
      }
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function initAuth(
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
): Unsubscribe {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthSuccess?.(user, null);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
}

export async function googleSignIn(): Promise<{
  user: User;
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getAccessToken(): string | null {
  return cachedAccessToken;
}

export async function logout(): Promise<void> {
  cachedAccessToken = null;
  await signOut(auth);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function formatTimestampLabel(ts: unknown): string {
  if (
    ts &&
    typeof ts === 'object' &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  return 'Just now';
}

function extractTimestampMs(ts: unknown): number {
  if (
    ts &&
    typeof ts === 'object' &&
    'toMillis' in ts &&
    typeof (ts as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function subscribeActiveListings(
  onData: (items: MarketplaceListing[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colPath = 'marketplaceListings';
  const q = query(
    collection(db, colPath),
    where('status', '==', 'active')
  );
  return onSnapshot(
    q,
    (snap) => {
      const docsWithTime = snap.docs.map((d) => {
        const data = d.data();
        return {
          createdAtMs: extractTimestampMs(data.createdAt),
          item: {
            id: d.id,
            ownerId: String(data.ownerId ?? ''),
            farmerName: String(data.farmerName ?? ''),
            village: String(data.village ?? ''),
            cropName: String(data.cropName ?? ''),
            category: data.category,
            quantityValue: Number(data.quantityValue ?? 0),
            quantityUnit: data.quantityUnit,
            pricePerKg: Number(data.pricePerKg ?? 0),
            harvestDate: String(data.harvestDate ?? ''),
            freshnessLabel: String(data.freshnessLabel ?? ''),
            imageDataUrl: String(data.imageDataUrl ?? ''),
            status: data.status,
            isDemo: false,
          } as MarketplaceListing,
        };
      });
      docsWithTime.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(docsWithTime.map((entry) => entry.item));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createMarketplaceListing(
  input: Omit<MarketplaceListing, 'id' | 'ownerId' | 'status' | 'isDemo'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with Google to publish a harvest listing.');

  const listingId = makeDocId('listing');
  const path = `marketplaceListings/${listingId}`;

  const payload = {
    ownerId: user.uid,
    farmerName: input.farmerName.trim().slice(0, 80),
    village: input.village.trim().slice(0, 100),
    cropName: input.cropName.trim().slice(0, 80),
    category: input.category,
    quantityValue: Math.max(1, Math.min(100000, Number(input.quantityValue))),
    quantityUnit: input.quantityUnit,
    pricePerKg: Math.max(1, Math.min(100000, Number(input.pricePerKg))),
    harvestDate: input.harvestDate.trim().slice(0, 10),
    freshnessLabel: input.freshnessLabel.trim().slice(0, 60),
    imageDataUrl: (input.imageDataUrl || '').slice(0, 450000),
    status: 'active' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'marketplaceListings', listingId), payload);
    return listingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markListingSoldOut(listing: MarketplaceListing): Promise<void> {
  const path = `marketplaceListings/${listing.id}`;
  try {
    await updateDoc(doc(db, 'marketplaceListings', listing.id), {
      quantityValue: listing.quantityValue,
      pricePerKg: listing.pricePerKg,
      status: 'sold_out',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMarketplaceListing(listingId: string): Promise<void> {
  const path = `marketplaceListings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'marketplaceListings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCropPlanToFirestore(
  input: Omit<CropPlanRecord, 'id' | 'ownerId' | 'createdAtLabel'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with Google to save crop plans.');
  const planId = makeDocId('plan');
  const colPath = `users/${user.uid}/cropPlans`;
  const path = `${colPath}/${planId}`;
  try {
    await setDoc(doc(db, colPath, planId), {
      ownerId: user.uid,
      regionId: input.regionId.slice(0, 60),
      soilType: input.soilType,
      season: input.season,
      expectedRainfall: input.expectedRainfall,
      temperatureBand: input.temperatureBand,
      topCropName: input.topCropName.slice(0, 100),
      notes: input.notes.slice(0, 400),
      createdAt: serverTimestamp(),
    });
    return planId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserCropPlans(
  userId: string,
  onData: (plans: CropPlanRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colPath = `users/${userId}/cropPlans`;
  const q = query(collection(db, colPath), where('ownerId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data();
        return {
          createdAtMs: extractTimestampMs(data.createdAt),
          item: {
            id: d.id,
            ownerId: String(data.ownerId ?? ''),
            regionId: String(data.regionId ?? ''),
            soilType: data.soilType,
            season: data.season,
            expectedRainfall: data.expectedRainfall,
            temperatureBand: data.temperatureBand,
            topCropName: String(data.topCropName ?? ''),
            notes: String(data.notes ?? ''),
            createdAtLabel: formatTimestampLabel(data.createdAt),
          } as CropPlanRecord,
        };
      });
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(rows.map((r) => r.item));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function placeOrderInFirestore(
  buyerName: string,
  deliveryAddress: string,
  totalInr: number,
  itemSummary: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with Google to save orders to your account.');
  const orderId = makeDocId('order');
  const colPath = `users/${user.uid}/orders`;
  const path = `${colPath}/${orderId}`;
  try {
    await setDoc(doc(db, colPath, orderId), {
      buyerId: user.uid,
      buyerName: buyerName.trim().slice(0, 80),
      deliveryAddress: deliveryAddress.trim().slice(0, 200),
      totalInr: Math.max(1, Math.min(10000000, Number(totalInr))),
      itemSummary: itemSummary.trim().slice(0, 500),
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserOrders(
  userId: string,
  onData: (orders: MarketplaceOrderRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colPath = `users/${userId}/orders`;
  const q = query(collection(db, colPath), where('buyerId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data();
        return {
          createdAtMs: extractTimestampMs(data.createdAt),
          item: {
            id: d.id,
            buyerId: String(data.buyerId ?? ''),
            buyerName: String(data.buyerName ?? ''),
            deliveryAddress: String(data.deliveryAddress ?? ''),
            totalInr: Number(data.totalInr ?? 0),
            itemSummary: String(data.itemSummary ?? ''),
            status: data.status,
            createdAtLabel: formatTimestampLabel(data.createdAt),
          } as MarketplaceOrderRecord,
        };
      });
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(rows.map((r) => r.item));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveCropScanToFirestore(
  cropName: string,
  diagnosisName: string,
  confidencePct: number,
  treatmentSummary: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with Google to save scan history.');
  const scanId = makeDocId('scan');
  const colPath = `users/${user.uid}/scanLogs`;
  const path = `${colPath}/${scanId}`;
  try {
    await setDoc(doc(db, colPath, scanId), {
      ownerId: user.uid,
      cropName: cropName.slice(0, 80),
      diagnosisName: diagnosisName.slice(0, 120),
      confidencePct: Math.max(0, Math.min(100, Number(confidencePct))),
      treatmentSummary: treatmentSummary.slice(0, 400),
      createdAt: serverTimestamp(),
    });
    return scanId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserScanLogs(
  userId: string,
  onData: (logs: CropScanLogRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colPath = `users/${userId}/scanLogs`;
  const q = query(collection(db, colPath), where('ownerId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data();
        return {
          createdAtMs: extractTimestampMs(data.createdAt),
          item: {
            id: d.id,
            ownerId: String(data.ownerId ?? ''),
            cropName: String(data.cropName ?? ''),
            diagnosisName: String(data.diagnosisName ?? ''),
            confidencePct: Number(data.confidencePct ?? 0),
            treatmentSummary: String(data.treatmentSummary ?? ''),
            createdAtLabel: formatTimestampLabel(data.createdAt),
          } as CropScanLogRecord,
        };
      });
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(rows.map((r) => r.item));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}
