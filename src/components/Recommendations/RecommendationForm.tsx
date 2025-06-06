import React, { useState } from 'react';
import { Button, TextInput, Select, TextArea } from '@gravity-ui/uikit';
import { CreateRecommendationRequest, RecommendationResponse } from '../../api/types';
import styles from './RecommendationForm.module.scss';

interface RecommendationFormProps {
  initialData?: RecommendationResponse;
  onSubmit: (data: CreateRecommendationRequest) => Promise<void>;
  onCancel: () => void;
}

const priorityOptions = [
  { value: 'low', content: 'Low' },
  { value: 'medium', content: 'Medium' },
  { value: 'high', content: 'High' },
];

export const RecommendationForm: React.FC<RecommendationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateRecommendationRequest>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    priority: initialData?.priority || 'low',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label>Title</label>
        <TextInput
          value={formData.title}
          onUpdate={(value) => setFormData({ ...formData, title: value })}
          placeholder="Enter title"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <TextArea
          value={formData.description}
          onUpdate={(value) => setFormData({ ...formData, description: value })}
          placeholder="Enter description"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Category</label>
        <TextInput
          value={formData.category}
          onUpdate={(value) => setFormData({ ...formData, category: value })}
          placeholder="Enter category"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Priority</label>
        <Select
          value={[formData.priority]}
          onUpdate={([value]) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })}
          options={priorityOptions}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <Button
          view="action"
          type="submit"
          loading={loading}
        >
          {initialData ? 'Update' : 'Create'}
        </Button>
        <Button
          view="flat"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}; 