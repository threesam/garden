import type { Metadata } from 'next';
import { JournalView } from '@/components/journal/journal-view';

export const metadata: Metadata = {
  title: 'journal — threesam',
  robots: { index: false, follow: false },
};

export default function JournalPage() {
  return <JournalView />;
}
