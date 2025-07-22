import { useState } from "react";
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList";
import { CreateAnnouncementForm } from "@/components/announcements/CreateAnnouncementForm";

export const AnnouncementsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // Refresh the list by toggling the key
    window.location.reload();
  };

  if (showCreateForm) {
    return (
      <div className="p-6">
        <CreateAnnouncementForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AnnouncementsList onCreateNew={() => setShowCreateForm(true)} />
    </div>
  );
};