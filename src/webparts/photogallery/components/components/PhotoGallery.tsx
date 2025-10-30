import * as React from 'react';
import { Image } from './../types';
import { useState, useMemo } from 'react';

interface PhotoGalleryProps {
    images: Image[];
    galleryTitle: string;
    onAddImage: () => void;
    onEditImage: (image: Image) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, galleryTitle, onAddImage, onEditImage }) => {

        const [searchQuery, setSearchQuery] = useState('');

    const filteredImages = useMemo(() => {
        if (!searchQuery.trim()) {
            return images;
        }
        return images.filter(image => 
            image.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [images, searchQuery]);

    return (
       <div className="d-flex flex-column h-100">
           <div className="d-flex justify-content-between align-items-center mb-4 flex-shrink-0 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                    <h4 className="mb-0 text-nowrap">
                    Gallery: <span className="text-success">{galleryTitle}</span>
                </h4>
                <div className="input-group" style={{minWidth: '250px', maxWidth: '400px'}}>
                         <input
                            type="text"
                            className="form-control"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search gallery by image title"
                        />
                        <span className="input-group-text" id="basic-addon1">
                            <i className="bi bi-search"></i>
                        </span>
                    </div>
                </div>
                <button className="btn btn-success btn-lg" onClick={onAddImage}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className="me-2" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                    </svg>Add New Image
                </button>
            </div>
             <div className="row g-4 flex-grow-1" style={{ overflowY: 'auto' }}>
              {filteredImages.length > 0 ? (
                    filteredImages.map(image => (
                        <div key={image.id} className="col-xl-4 col-md-6">
                            <div className="card h-100 shadow-sm">
                                <img src={image.src} className="card-img-top" alt={image.title} style={{ height: '250px', objectFit: 'cover' }} />
                                <div className="card-body">
                                    <h5 className="card-title">{image.title || 'Untitled'}</h5>
                                    <p className="card-text text-muted small">{image.description || ''}</p>
                                </div>
                                <div className="card-footer bg-white border-top-0 pb-3">
                                     <button className="btn btn-success w-100" onClick={() => onEditImage(image)}>
                                        <i className="bi bi-pencil-square me-2"></i>Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="text-center p-5 bg-light rounded">
                            {searchQuery ? (
                                <>
                                    <h2>No results found for "{searchQuery}"</h2>
                                    <p className="lead text-muted">Please try a different search term.</p>
                                </>
                            ) : (
                                <>
                            <h2>This folder is empty!</h2>
                            <p className="lead text-muted">Click "Add New Image" to upload an image to this folder, or select another folder.</p>
                            </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoGallery;
