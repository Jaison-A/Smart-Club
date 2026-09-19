import { useEffect, useState } from 'react';
import { Award, Download } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { certificatesApi } from '../../api/events.api';

export default function StudentCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    certificatesApi
      .listForUser(user.id || user._id)
      .then(({ data }) => setCertificates(data.data.certificates))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleDownload(certificateId) {
    setDownloadingId(certificateId);
    try {
      await certificatesApi.download(certificateId);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <TopBar title="My Certificates" subtitle="Certificates you've earned from events." />
      <div className="p-8">
        {isLoading ? (
          <Spinner />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Attend an event and get your attendance marked to earn a certificate."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert._id} accent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">{cert.event?.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">{cert.club?.name}</p>
                    <p className="mt-2 font-mono text-xs text-ink-muted">{cert.certificateId}</p>
                  </div>
                  <Award size={20} className="text-accent" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleDownload(cert.certificateId)}
                  disabled={downloadingId === cert.certificateId}
                >
                  <Download size={14} /> {downloadingId === cert.certificateId ? 'Downloading...' : 'Download PDF'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
