import * as React from "react";
import { useState, useMemo } from "react";
import Header from "./components/Header";
import PhotoGallery from "./components/PhotoGallery";
import ImageEditorModal from "./components/ImageEditorModal";
import FolderList from "./components/FolderList";
import { Image } from "./types";
import { Web } from "sp-pnp-js";

const App: React.FC = () => {
  const [folders, setFolders] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<any | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(0);
  const web = new Web(
    "https://grueneweltweit.sharepoint.com/sites/GrueneWeltweit/Washington/webstudio"
  );
  function guidToNumber(guid: string): number {
    const hex = guid.replace(/-/g, "");
    const num = parseInt(hex.slice(0, 12), 16);
    return num;
  }
  const libraryName = "PublishingImages"; 
  const siteRelative = "/sites/GrueneWeltweit/Washington/webstudio"; 

  const fetchData = async () => {
    try {
      const libraryRoot = web.getFolderByServerRelativeUrl(
        `${siteRelative}/${libraryName}`
      );
      const subFolders = await libraryRoot.folders
        .select("Name", "ServerRelativeUrl", "UniqueId")
        .get();

      const filteredFolders = subFolders
        .filter((f: any) => f.Name !== "Forms" && !f.Name.startsWith("_"))
        .map((f: any) => ({ id: guidToNumber(f.UniqueId), name: f.Name }));

      setFolders(filteredFolders);
      const items = await web.lists
        .getById("8a54a424-5c8f-4106-af7f-f5bed7b23c9d")
        .items.select(
          "Id",
          "Title",
          "Description",
          "FileLeafRef",
          "EncodedAbsUrl",
          "ImageWidth",
          "ImageHeight",
          "CopyrightInfo"
        )
        .getAll();

      const getFolderId = (fileUrl: string) => {
        try {
          const url = new URL(fileUrl);
          const pathSegments = url.pathname.split("/").filter(Boolean);

          // Look for a folder in the URL path that exists in filteredFolders
          for (let i = pathSegments.length - 2; i >= 0; i--) {
            const segment = decodeURIComponent(pathSegments[i]).toLowerCase();
            const folder = filteredFolders.find(
              (f: any) => f.name.toLowerCase() === segment
            );
            if (folder) return folder.id;
          }
          return null;
        } catch (err) {
          console.error("Error parsing folder from URL:", err);
          return null;
        }
      };

      const mappedImages = items
        .map((item: any) => {
          const fileUrl = item.EncodedAbsUrl || item.FileRef;
          if (fileUrl && fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
            return {
              id: item.ID,
              folderId: getFolderId(fileUrl),
              src: fileUrl,
              name: item.FileLeafRef,
              title: item.Title || "",
              description: item.Description || "",
              copyright: item.CopyrightInfo || "",
            };
          }
          return null;
        })
        .filter(Boolean);

      setImages(mappedImages);
    } catch (error) {
      console.error("Data fetching error:", error);
    }
  };
  React.useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingImage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (image: Image) => {
    setEditingImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingImage(null);
  };

  // Utility to convert base64 to Blob
  const base64ToBlob = (base64: string, contentType = "image/jpeg") => {
    const byteCharacters = atob(base64.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  const handleSaveImage = async (
    savedImage: Omit<Image, "id"> & { id?: number }
  ) => {

    try {
      const folder = folders.find((f) => f.id === savedImage.folderId);
      if (!folder) {
        console.error("Folder not found for folderId:", savedImage.folderId);
        return;
      }

      const folderPath = `${siteRelative}/${libraryName}/${folder.name}`;

      if (savedImage.src.startsWith("data:image")) {
        // Convert base64 to blob
        const blob = base64ToBlob(savedImage.src);
        const fileAddResult = await web
          .getFolderByServerRelativeUrl(folderPath)
          .files.add(savedImage.name, blob, true);

        const serverRelativeUrl = fileAddResult.data.ServerRelativeUrl;
        const file = web.getFileByServerRelativeUrl(serverRelativeUrl);
        const listItem = await file.listItemAllFields.select("Id").get();

        const list = web.lists.getById("8a54a424-5c8f-4106-af7f-f5bed7b23c9d");
        await list.items.getById(listItem.Id).update({
          Title: savedImage.title || "",
          Description: savedImage.description || "",
          CopyrightInfo: savedImage.copyright || "",
        });
        await fetchData();
      } else {
        console.error("Image src is not a base64 string.");
      }

      handleCloseModal(); 
    } catch (error) {
      console.error("Error saving image to SharePoint:", error);
    }
  };
  const handleSelectFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
  };

  const filteredImages = useMemo(() => {
    if (selectedFolderId === 0) {
      // "All Images"
      return images;
    }
    return images.filter((img) => img.folderId === selectedFolderId);
  }, [images, selectedFolderId]);

  const selectedFolderName = useMemo(() => {
    if (selectedFolderId === 0) return "All Images";
    return folders.find((f) => f.id === selectedFolderId)?.name || "";
  }, [folders, selectedFolderId]);

  return (
    <>
      <Header />
      <main className="container-fluid mt-4">
        <div className="row">
          <aside className="col-lg-3">
            <FolderList
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
            />
          </aside>
          <section className="col-lg-9">
            <PhotoGallery
              images={filteredImages}
              galleryTitle={selectedFolderName}
              onAddImage={handleOpenAddModal}
              onEditImage={handleOpenEditModal}
            />
          </section>
        </div>
      </main>

      {isModalOpen && (
        <ImageEditorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveImage}
          imageToEdit={editingImage}
          folders={folders}
          images={images}
        />
      )}

      <footer className="text-center text-muted py-4 mt-4">
        <p>&copy; 2024 Image Editor Pro. All Rights Reserved.</p>
      </footer>
    </>
  );
};

export default App;
