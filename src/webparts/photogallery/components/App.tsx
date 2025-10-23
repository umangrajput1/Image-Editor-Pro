import * as React from "react";
import { useState, useMemo } from "react";
import Header from "./components/Header";
import PhotoGallery from "./components/PhotoGallery";
import ImageEditorModal from "./components/ImageEditorModal";
import FolderList from "./components/FolderList";
import { Image, Folder } from "./types";
import { Web } from "sp-pnp-js";

// const INITIAL_FOLDERS: Folder[] = [
//   { id: 1, name: "Landscapes" },
//   { id: 2, name: "Cityscapes" },
//   { id: 3, name: "Portraits" },
// ];

// const INITIAL_IMAGES: Image[] = [
//   {
//     id: 1,
//     folderId: 1,
//     src: "https://picsum.photos/id/10/800/600",
//     name: "sample-forest.jpg",
//     title: "Misty Forest Path",
//     description:
//       "A serene and misty path winding through a dense forest, evoking a sense of mystery and peace.",
//     copyright: "© John Doe",
//   },
//   {
//     id: 2,
//     folderId: 2,
//     src: "https://picsum.photos/id/20/800/600",
//     name: "city-street.jpg",
//     title: "City Street at Night",
//     description:
//       "The blurred lights of traffic on a city street at night, capturing the vibrant energy of urban life.",
//     copyright: "© Jane Smith",
//   },
//   {
//     id: 3,
//     folderId: 3,
//     src: "https://picsum.photos/id/30/800/600",
//     name: "camera-person.jpg",
//     title: "Holding a Camera",
//     description:
//       "A close-up shot of a person holding a vintage camera, ready to capture a moment.",
//     copyright: "© Unsplash",
//   },
// ];

const App: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(0); // 0 for "All Images"

  const fetchData = async (): Promise<any> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
      const items = await web.lists
        .getById("ff190fb0-b184-409f-b27e-e6f1b63e939d")
        .items.select(
          "Id",
          "Title",
          "Description",
          "FileLeafRef",
          "FileRef",
          "EncodedAbsUrl",
          "ImageWidth",
          "ImageHeight",
          "copyright"
        )
        .get();

      const mappedFolder = items
        .map((item: any) => {
          if (
            item.Description == null &&
            item.ImageHeight === null &&
            item.ImageWidth === null
          ) {
            return {
              id: item.ID,
              name: item.FileLeafRef,
            };
          }
          return null;
        })
        .filter(Boolean); // remove nulls

      setFolders(mappedFolder);

      // local function using mappedFolder instead of state
      const getFolderId = (data: string) => {
        const lowerData = data.toLowerCase();
        const folder = mappedFolder.find(
          (folder: any) =>
            folder.name && lowerData.includes(folder.name.toLowerCase().trim())
        );
        return folder ? folder.id : null;
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
              title: item.Title,
              description: item.Description,
              copyright: item.copyright,
            };
          }
          return null;
        })
        .filter(Boolean);

      setImages(mappedImages);

      console.log("folders:", mappedFolder);
      console.log("images:", mappedImages);
      console.log("raw items:", items);
    } catch (error) {
      console.error("data fetching error", error);
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
    const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
    console.log("saving image data ", savedImage);

    try {
      const folder = folders.find((f) => f.id === savedImage.folderId);
      if (!folder) {
        console.error("Folder not found for folderId:", savedImage.folderId);
        return;
      }

      const folderPath = `/sites/TSO/Images1/${folder.name}`;

      if (savedImage.src.startsWith("data:image")) {
        // Convert base64 to blob
        const blob = base64ToBlob(savedImage.src);
        
        const fileAddResult = await web
          .getFolderByServerRelativeUrl(folderPath)
          .files.add(savedImage.name, blob, true);

        // Get the uploaded file’s server-relative URL
        const serverRelativeUrl = fileAddResult.data.ServerRelativeUrl;

        // Get file object
        const file = web.getFileByServerRelativeUrl(serverRelativeUrl);

        // Get associated list item
        const listItem = await file.listItemAllFields.select("Id").get();

        // Update metadata
        const list = web.lists.getById("ff190fb0-b184-409f-b27e-e6f1b63e939d");
        const updateResult = await list.items.getById(listItem.Id).update({
          Title: savedImage.title || savedImage.name,
          Description: savedImage.description || "",
          copyright: savedImage.copyright || "",
        });

        console.log("Metadata updated successfully:", updateResult);
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
