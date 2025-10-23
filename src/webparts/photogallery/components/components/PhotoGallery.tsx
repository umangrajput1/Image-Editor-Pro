import * as React from 'react';
import { Image } from './../types';

interface PhotoGalleryProps {
    images: Image[];
    galleryTitle: string;
    onAddImage: () => void;
    onEditImage: (image: Image) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, galleryTitle, onAddImage, onEditImage }) => {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0">
                    Gallery: <span className="text-primary">{galleryTitle}</span>
                </h1>
                <button className="btn btn-primary btn-lg" onClick={onAddImage}>
                    <i className="bi bi-plus-circle-fill me-2"></i>Add New Image
                </button>
            </div>
            <div className="row g-4">
                {images.length > 0 ? (
                    images.map(image => (
                        <div key={image.id} className="col-xl-4 col-md-6">
                            <div className="card h-100 shadow-sm">
                                <img src={image.src} className="card-img-top" alt={image.title} style={{ height: '250px', objectFit: 'cover' }} />
                                <div className="card-body">
                                    <h5 className="card-title">{image.title || 'Untitled'}</h5>
                                    <p className="card-text text-muted small">{image.description || 'No description.'}</p>
                                </div>
                                <div className="card-footer bg-white border-top-0 pb-3">
                                     <button className="btn btn-outline-secondary w-100" onClick={() => onEditImage(image)}>
                                        <i className="bi bi-pencil-square me-2"></i>Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="text-center p-5 bg-light rounded">
                            <h2>This folder is empty!</h2>
                            <p className="lead text-muted">Click "Add New Image" to upload an image to this folder, or select another folder.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoGallery;
