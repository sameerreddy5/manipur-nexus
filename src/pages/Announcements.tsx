import { useState } from "react";
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList";
import { CreateAnnouncementForm } from "@/components/announcements/CreateAnnouncementForm";

export const AnnouncementsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {showCreateForm ? (
        <CreateAnnouncementForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <AnnouncementsList onCreateNew={() => setShowCreateForm(true)} />
      )}
    </div>
  );
};