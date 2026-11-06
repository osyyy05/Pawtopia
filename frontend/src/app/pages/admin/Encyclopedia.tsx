import { useEffect, useState } from 'react';
import AdminManagement from './AdminManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Plus, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000';

interface Animal {
  id: number;
  name: string;
  scientific_name: string;
  category: string;
  habitat: string;
  diet: string;
  lifespan: string;
  conservation_status: string;
  description: string;

  image: string;
  image_file: string | null;

  gallery: string[];
  gallery_files: string[];

  facts: string[];

  video: string | null;

  physical_characteristics: string;
  behaviour: string;
  reproduction: string;
  geographic_range: string;
  conservation_threats: string;
  ecosystem_role: string;
}

interface AnimalForm {
  name: string;
  scientific_name: string;
  category: string;
  habitat: string;
  diet: string;
  lifespan: string;
  conservation_status: string;
  description: string;

  image: string;
  image_file: File | null;

  gallery: string[];
  gallery_files: File[];

  facts: string[];

  physical_characteristics: string;
  behaviour: string;
  reproduction: string;
  geographic_range: string;
  conservation_threats: string;
  ecosystem_role: string;

  video: File | null;
}

const emptyForm: AnimalForm = {
  name: '',
  scientific_name: '',
  category: '',
  habitat: '',
  diet: '',
  lifespan: '',
  conservation_status: '',
  description: '',
  image: '',
  image_file: null,
  gallery: [''],
  gallery_files: [],
  facts: [''],
  physical_characteristics: '',
  behaviour: '',
  reproduction: '',
  geographic_range: '',
  conservation_threats: '',
  ecosystem_role: '',
  video: null,
};

export default function Encyclopedia() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState<AnimalForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [removeImageFile, setRemoveImageFile] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [removedGalleryFiles, setRemovedGalleryFiles] = useState<string[]>([]);

  const token = sessionStorage.getItem('access_token');

  // ==========================================
  // FETCH ANIMALS
  // ==========================================
  const fetchAnimals = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/animals/`);

      if (!response.ok) {
        throw new Error('Failed to fetch animals');
      }

      const data = await response.json();
      setAnimals(data);
    } catch (error) {
      console.error('Error fetching animals:', error);
      toast.error('Failed to load animals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  // ==========================================
  // OPEN ADD FORM
  // ==========================================
  const openAddForm = () => {
    setEditingAnimal(null);
    setForm(emptyForm);

    setRemoveImageFile(false);
    setRemoveVideo(false);
    setRemovedGalleryFiles([]);

    setDialogOpen(true);
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================
  const openEditForm = (id: string) => {
    const animal = animals.find(
      (item) => item.id === Number(id)
    );

    if (!animal) return;

    setEditingAnimal(animal);

    setRemoveImageFile(false);
    setRemoveVideo(false);
    setRemovedGalleryFiles([]);

    setForm({
    name: animal.name || '',
    scientific_name: animal.scientific_name || '',
    category: animal.category || '',
    habitat: animal.habitat || '',
    diet: animal.diet || '',
    lifespan: animal.lifespan || '',
    conservation_status: animal.conservation_status || '',
    description: animal.description || '',
    image: animal.image || '',
    image_file: null,
    gallery:
        animal.gallery && animal.gallery.length > 0
        ? animal.gallery
        : [''],

    gallery_files: [],

    facts:
        animal.facts && animal.facts.length > 0
        ? animal.facts
        : [''],
    physical_characteristics: animal.physical_characteristics || '',
    behaviour: animal.behaviour || '',
    reproduction: animal.reproduction || '',
    geographic_range: animal.geographic_range || '',
    conservation_threats: animal.conservation_threats || '',
    ecosystem_role: animal.ecosystem_role || '',
    video: null,
    });

    setDialogOpen(true);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================
    const updateField = (
    field: keyof AnimalForm,
    value: string | File | null
    ) => {
    setForm((prev) => ({
        ...prev,
        [field]: value,
    }));
    };

  // ==========================================
  // GALLERY
  // ==========================================
  const updateGallery = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const addGallery = () => {
    setForm((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ''],
    }));
  };

  const removeGallery = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // ==========================================
  // FACTS
  // ==========================================
  const updateFact = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      facts: prev.facts.map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const addFact = () => {
    setForm((prev) => ({
      ...prev,
      facts: [...prev.facts, ''],
    }));
  };

  const removeFact = (index: number) => {
    setForm((prev) => ({
      ...prev,
      facts: prev.facts.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // ==========================================
  // SAVE ANIMAL
  // ==========================================
    const saveAnimal = async () => {
    if (!form.name.trim()) {
        toast.error('Animal name is required.');
        return;
    }

    if (!form.scientific_name.trim()) {
        toast.error('Scientific name is required.');
        return;
    }

    if (!form.category.trim()) {
        toast.error('Category is required.');
        return;
    }

    try {
        setSaving(true);

        const url = editingAnimal
        ? `${API_URL}/api/animals/${editingAnimal.id}/`
        : `${API_URL}/api/animals/`;

        const method = editingAnimal ? 'PATCH' : 'POST';

        const formData = new FormData();

        formData.append('name', form.name.trim());
        formData.append(
        'scientific_name',
        form.scientific_name.trim()
        );
        formData.append('category', form.category.trim());
        formData.append('habitat', form.habitat.trim());
        formData.append('diet', form.diet.trim());
        formData.append('lifespan', form.lifespan.trim());
        formData.append(
        'conservation_status',
        form.conservation_status.trim()
        );
        formData.append(
        'description',
        form.description.trim()
        );
        if (form.image.trim()) {
          formData.append('image', form.image.trim());
        }
        if (form.image_file) {
          formData.append('image_file', form.image_file);
        }
        if (removeImageFile) {
          formData.append('remove_image_file', 'true');
        }

        formData.append(
        'gallery',
        JSON.stringify(
            form.gallery
            .map((item) => item.trim())
            .filter(Boolean)
        )
        );

        formData.append(
        'facts',
        JSON.stringify(
            form.facts
            .map((item) => item.trim())
            .filter(Boolean)
        )
        );
        form.gallery_files.forEach((file) => {
          formData.append('gallery_files', file);
        });

        if (removedGalleryFiles.length > 0) {
          formData.append(
            'remove_gallery_files',
            JSON.stringify(removedGalleryFiles)
          );
        }

        formData.append(
        'physical_characteristics',
        form.physical_characteristics.trim()
        );

        formData.append(
        'behaviour',
        form.behaviour.trim()
        );

        formData.append(
        'reproduction',
        form.reproduction.trim()
        );

        formData.append(
        'geographic_range',
        form.geographic_range.trim()
        );

        formData.append(
        'conservation_threats',
        form.conservation_threats.trim()
        );

        formData.append(
        'ecosystem_role',
        form.ecosystem_role.trim()
        );

        if (form.video) {
        formData.append('video', form.video);
        }
        if (removeVideo) {
        formData.append('remove_video', 'true');
      }

        const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
        });

        if (!response.ok) {
        const errorData = await response.json();
        console.error(
            'Animal save error:',
            errorData
        );
        throw new Error('Failed to save animal');
        }

        toast.success(
        editingAnimal
            ? 'Animal updated successfully!'
            : 'Animal added successfully!'
        );

        setDialogOpen(false);
        setEditingAnimal(null);
        setForm(emptyForm);

        setRemoveImageFile(false);
        setRemoveVideo(false);
        setRemovedGalleryFiles([]);

        await fetchAnimals();
    } catch (error) {
        console.error(
        'Error saving animal:',
        error
        );
        toast.error('Failed to save animal.');
    } finally {
        setSaving(false);
    }
    };

  // ==========================================
  // DELETE ANIMAL
  // ==========================================
  const deleteAnimal = async (id: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/animals/${id}/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete animal');
      }

      toast.success('Animal deleted successfully!');

      await fetchAnimals();
    } catch (error) {
      console.error('Error deleting animal:', error);
      toast.error('Failed to delete animal.');
    }
  };

  // ==========================================
  // TABLE DATA
  // ==========================================
  const tableData = animals.map((animal) => ({
    id: animal.id,
    name: animal.name,
    scientific_name: animal.scientific_name,
    category: animal.category,
    conservation_status: animal.conservation_status,
  }));

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-300">
            Loading encyclopedia...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminManagement
        title="Encyclopedia Management"
        description="Manage animal encyclopedia information"
        columns={[
          'Name',
          'Scientific Name',
          'Category',
          'Conservation Status',
        ]}
        data={tableData}
        onAdd={openAddForm}
        onEdit={openEditForm}
        onDelete={deleteAnimal}
      />

      {/* ========================================
          ADD / EDIT DIALOG
      ======================================== */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {editingAnimal
                ? 'Edit Animal'
                : 'Add New Animal'}
            </DialogTitle>

            <DialogDescription className="text-gray-400">
              {editingAnimal
                ? 'Update the complete animal encyclopedia information.'
                : 'Enter the complete animal encyclopedia information.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">

            {/* BASIC INFORMATION */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label>Animal Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      updateField(
                        'name',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Malayan Tiger"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scientific Name *</Label>
                  <Input
                    value={form.scientific_name}
                    onChange={(e) =>
                      updateField(
                        'scientific_name',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Panthera tigris jacksoni"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Input
                    value={form.category}
                    onChange={(e) =>
                      updateField(
                        'category',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Mammal"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conservation Status</Label>
                  <Input
                    value={form.conservation_status}
                    onChange={(e) =>
                      updateField(
                        'conservation_status',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Critically Endangered"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lifespan</Label>
                  <Input
                    value={form.lifespan}
                    onChange={(e) =>
                      updateField(
                        'lifespan',
                        e.target.value
                      )
                    }
                    placeholder="e.g. 15-20 years"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

              </div>
            </div>

            {/* HABITAT & DIET */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                Habitat & Diet
              </h3>

              <div className="space-y-4">

                <div className="space-y-2">
                  <Label>Habitat</Label>
                  <Textarea
                    value={form.habitat}
                    onChange={(e) =>
                      updateField(
                        'habitat',
                        e.target.value
                      )
                    }
                    placeholder="Describe the animal's natural habitat..."
                    className="bg-white/10 border-white/20 text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Diet</Label>
                  <Textarea
                    value={form.diet}
                    onChange={(e) =>
                      updateField(
                        'diet',
                        e.target.value
                      )
                    }
                    placeholder="Describe the animal's diet..."
                    className="bg-white/10 border-white/20 text-white min-h-[100px]"
                  />
                </div>

              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                Description
              </h3>

              <Textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    'description',
                    e.target.value
                  )
                }
                placeholder="Enter a detailed description of the animal..."
                className="bg-white/10 border-white/20 text-white min-h-[160px]"
              />
            </div>

            {/* MORE INFORMATION */}
            <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                More Information
            </h3>

            <div className="space-y-4">

                <div className="space-y-2">
                <Label>Physical Characteristics</Label>
                <Textarea
                    value={form.physical_characteristics}
                    onChange={(e) =>
                    updateField(
                        'physical_characteristics',
                        e.target.value
                    )
                    }
                    placeholder="Describe the animal's physical characteristics..."
                    className="bg-white/10 border-white/20 text-white min-h-[120px]"
                />
                </div>

                <div className="space-y-2">
                <Label>Behaviour</Label>
                <Textarea
                    value={form.behaviour}
                    onChange={(e) =>
                    updateField(
                        'behaviour',
                        e.target.value
                    )
                    }
                    placeholder="Describe the animal's behaviour..."
                    className="bg-white/10 border-white/20 text-white min-h-[120px]"
                />
                </div>

                <div className="space-y-2">
                <Label>Reproduction</Label>
                <Textarea
                    value={form.reproduction}
                    onChange={(e) =>
                    updateField(
                        'reproduction',
                        e.target.value
                    )
                    }
                    placeholder="Describe reproduction, breeding, gestation, offspring, etc..."
                    className="bg-white/10 border-white/20 text-white min-h-[120px]"
                />
                </div>

                <div className="space-y-2">
                <Label>Geographic Range</Label>
                <Textarea
                    value={form.geographic_range}
                    onChange={(e) =>
                    updateField(
                        'geographic_range',
                        e.target.value
                    )
                    }
                    placeholder="Describe where this animal is found..."
                    className="bg-white/10 border-white/20 text-white min-h-[120px]"
                />
                </div>

                <div className="space-y-2">
                <Label>Conservation & Threats</Label>
                <Textarea
                    value={form.conservation_threats}
                    onChange={(e) =>
                    updateField(
                        'conservation_threats',
                        e.target.value
                    )
                    }
                    placeholder="Describe conservation efforts and major threats..."
                    className="bg-white/10 border-white/20 text-white min-h-[120px]"
                />
                </div>

                <div className="space-y-2">
                <Label>Role in Ecosystem</Label>
                <Textarea
                    value={form.ecosystem_role}
                    onChange={(e) =>
                    updateField(
                        'ecosystem_role',
                        e.target.value
                    )
                    }
                    placeholder="Describe the animal's role in the ecosystem..."
                    className="bg-white/10 border-white/20 text-white min-h-[120px]"
                />
                </div>

            </div>
            </div>

            {/* MAIN IMAGE */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                Main Image
              </h3>

{/* CURRENT IMAGE */}
{editingAnimal &&
  editingAnimal.image_file &&
  !removeImageFile && (
    <div className="space-y-3 mb-5">
      <Label className="text-gray-300">
        Current Uploaded Image
      </Label>

      <div className="flex items-start gap-4">
        <div className="w-64 h-40 rounded-lg overflow-hidden border border-white/10">
          <img
            src={editingAnimal.image_file}
            alt={editingAnimal.name}
            className="w-full h-full object-cover"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setRemoveImageFile(true)}
          className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Image
        </Button>
      </div>
    </div>
  )}

              {editingAnimal &&
                editingAnimal.image_file &&
                removeImageFile && (
                  <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm text-red-300">
                      Current uploaded image will be removed when you save.
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setRemoveImageFile(false)}
                      className="mt-2 text-gray-300 hover:text-white"
                    >
                      Undo
                    </Button>
                  </div>
                )}

              {/* OLD URL */}
              <div className="space-y-2">
                <Label>Image URL</Label>

                <Input
                  value={form.image}
                  onChange={(e) =>
                    updateField('image', e.target.value)
                  }
                  placeholder="https://..."
                  className="bg-white/10 border-white/20 text-white"
                />

                {form.image && (
                  <div className="mt-3">
                    <img
                      src={form.image}
                      alt="Animal preview"
                      className="w-40 h-28 object-cover rounded-lg border border-white/10"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* NEW IMAGE UPLOAD */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="animal-image-file">
                  Upload New Main Image
                </Label>

                <Input
                  id="animal-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    updateField(
                      'image_file',
                      e.target.files?.[0] || null
                    )
                  }
                  className="bg-white/10 border-white/20 text-white file:text-white"
                />

                {form.image_file && (
                  <p className="text-sm text-gray-300">
                    Selected: {form.image_file.name}
                  </p>
                )}
              </div>
            </div>

            {/* VIDEO */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                Animal Video
              </h3>

              {/* CURRENT VIDEO */}
              {editingAnimal &&
                editingAnimal.video &&
                !removeVideo && (
                  <div className="space-y-3 mb-5">
                    <Label className="text-gray-300">
                      Current Uploaded Video
                    </Label>

                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                      <video
                        controls
                        preload="metadata"
                        className="w-full max-h-[400px] object-contain"
                      >
                        <source
                          src={editingAnimal.video}
                          type={
                            editingAnimal.video.endsWith('.webm')
                              ? 'video/webm'
                              : 'video/mp4'
                          }
                        />

                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRemoveVideo(true)}
                      className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Video
                    </Button>
                  </div>
                )}

              {editingAnimal &&
                editingAnimal.video &&
                removeVideo && (
                  <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm text-red-300">
                      Current uploaded video will be removed when you save.
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setRemoveVideo(false)}
                      className="mt-2 text-gray-300 hover:text-white"
                    >
                      Undo
                    </Button>
                  </div>
                )}

              {/* UPLOAD NEW VIDEO */}
              <div className="space-y-3">
                <Label htmlFor="animal-video">
                  {editingAnimal?.video
                    ? 'Replace Video'
                    : 'Upload Video'}
                </Label>

                <Input
                  id="animal-video"
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    updateField(
                      'video',
                      e.target.files?.[0] || null
                    )
                  }
                  className="bg-white/10 border-white/20 text-white file:text-white"
                />

                {form.video && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Video className="w-4 h-4 text-cyan-400" />
                    Selected: {form.video.name}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Upload MP4 or WebM video.
                </p>
              </div>
            </div>

            {/* GALLERY */}
            <div>
              {/* Gallery Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-400">
                  Gallery
                </h3>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGallery}
                  className="border-cyan-500/30 text-cyan-400"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Image URL
                </Button>
              </div>

              {/* CURRENT UPLOADED GALLERY */}
              {editingAnimal &&
                editingAnimal.gallery_files &&
                editingAnimal.gallery_files.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <Label className="text-gray-300">
                      Current Uploaded Images
                    </Label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {editingAnimal.gallery_files
                        .filter((image) => !removedGalleryFiles.includes(image))
                        .map((image, index) => (
                          <div
                            key={image}
                            className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30"
                          >
                            <div className="aspect-video">
                              <img
                                src={image}
                                alt={`${editingAnimal.name} gallery ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex items-center justify-between bg-black/70 px-3 py-2">
                              <p className="text-xs text-gray-300 truncate">
                                Image {index + 1}
                              </p>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRemovedGalleryFiles((prev) => [
                                    ...prev,
                                    image,
                                  ])
                                }
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* UPLOAD NEW GALLERY IMAGES */}
              <div className="space-y-3 mb-6">
                <Label htmlFor="gallery-files">
                  Upload Additional Gallery Images
                </Label>

                <Input
                  id="gallery-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gallery_files: Array.from(e.target.files || []),
                    }))
                  }
                  className="bg-white/10 border-white/20 text-white file:text-white"
                />

                {form.gallery_files.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      Selected images:
                    </p>

                    {form.gallery_files.map((file, index) => (
                      <p
                        key={index}
                        className="text-sm text-gray-300"
                      >
                        📷 {file.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* OLD URL GALLERY */}
              <div className="space-y-3">
                <Label className="text-gray-300">
                  Gallery Image URLs
                </Label>

                {form.gallery.map((image, index) => (
                  <div
                    key={index}
                    className="flex gap-2"
                  >
                    <Input
                      value={image}
                      onChange={(e) =>
                        updateGallery(index, e.target.value)
                      }
                      placeholder={`Gallery image URL ${index + 1}`}
                      className="bg-white/10 border-white/20 text-white"
                    />

                    {form.gallery.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeGallery(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FACTS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-400">
                  Interesting Facts
                </h3>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFact}
                  className="border-cyan-500/30 text-cyan-400"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Fact
                </Button>
              </div>

              <div className="space-y-3">
                {form.facts.map(
                  (fact, index) => (
                    <div
                      key={index}
                      className="flex gap-2"
                    >
                      <Textarea
                        value={fact}
                        onChange={(e) =>
                          updateFact(
                            index,
                            e.target.value
                          )
                        }
                        placeholder={`Interesting fact ${index + 1}`}
                        className="bg-white/10 border-white/20 text-white"
                      />

                      {form.facts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            removeFact(index)
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDialogOpen(false)
                }
                className="border-white/20 text-gray-300"
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveAnimal}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {saving
                  ? 'Saving...'
                  : editingAnimal
                    ? 'Save Changes'
                    : 'Add Animal'}
              </Button>

            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}