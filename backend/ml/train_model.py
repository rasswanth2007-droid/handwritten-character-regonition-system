#!/usr/bin/env python
"""
Standalone script for training the CNN model for handwritten character recognition.
This script can be run independently to train and save models.
"""

import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class CharacterRecognitionModel:
    """CNN model for handwritten digit and alphabet recognition"""
    
    def __init__(self, model_type='digits'):
        self.model_type = model_type
        self.model = None
        if model_type == 'digits':
            self.classes = list('0123456789')
        elif model_type == 'alphabets':
            self.classes = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        else:
            self.classes = list('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        self.num_classes = len(self.classes)
        self.history = None
    
    def create_model(self, input_shape=(28, 28, 1)):
        """Create CNN architecture"""
        model = keras.Sequential([
            # First Convolutional Block
            keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
            keras.layers.BatchNormalization(),
            keras.layers.Conv2D(32, (3, 3), activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Dropout(0.25),
            
            # Second Convolutional Block
            keras.layers.Conv2D(64, (3, 3), activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Conv2D(64, (3, 3), activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Dropout(0.25),
            
            # Third Convolutional Block
            keras.layers.Conv2D(128, (3, 3), activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Dropout(0.25),
            
            # Dense Layers
            keras.layers.Flatten(),
            keras.layers.Dense(256, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.5),
            
            # Output Layer
            keras.layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def load_mnist(self):
        """Load and preprocess MNIST dataset"""
        print("Loading MNIST dataset...")
        (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
        
        x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
        x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
        
        print(f"MNIST loaded: {len(x_train)} training samples, {len(x_test)} test samples")
        return (x_train, y_train), (x_test, y_test)
    
    def load_emnist(self):
        """Load and preprocess EMNIST dataset using emnist package"""
        print("Loading EMNIST dataset...")
        try:
            import emnist
            # Load EMNIST letters dataset
            x_train, y_train = emnist.extract_training_samples('letters')
            x_test, y_test = emnist.extract_test_samples('letters')
            
            # EMNIST letters are 1-indexed (1-26), convert to 0-indexed
            y_train = y_train - 1
            y_test = y_test - 1
            
            # Normalize and reshape
            x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
            x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
            
            print(f"EMNIST loaded: {len(x_train)} training samples, {len(x_test)} test samples")
            return (x_train, y_train), (x_test, y_test)
        except Exception as e:
            print(f"Error loading EMNIST: {e}")
            print("Using only MNIST for training...")
            return self.load_mnist()
    
    def load_combined(self):
        """Load combined MNIST and EMNIST datasets"""
        print("Loading combined dataset...")
        (x_mnist_train, y_mnist_train), (x_mnist_test, y_mnist_test) = self.load_mnist()
        (x_emnist_train, y_emnist_train), (x_emnist_test, y_emnist_test) = self.load_emnist()
        
        # Shift EMNIST labels to start after digits (0-9 for digits, 10-35 for letters)
        y_emnist_train = y_emnist_train + 10
        y_emnist_test = y_emnist_test + 10
        
        # Combine datasets
        x_train = np.concatenate([x_mnist_train, x_emnist_train])
        y_train = np.concatenate([y_mnist_train, y_emnist_train])
        x_test = np.concatenate([x_mnist_test, x_emnist_test])
        y_test = np.concatenate([y_mnist_test, y_emnist_test])
        
        # Shuffle
        indices = np.random.permutation(len(x_train))
        x_train = x_train[indices]
        y_train = y_train[indices]
        
        indices = np.random.permutation(len(x_test))
        x_test = x_test[indices]
        y_test = y_test[indices]
        
        print(f"Combined dataset: {len(x_train)} training samples, {len(x_test)} test samples")
        return (x_train, y_train), (x_test, y_test)
    
    def train(self, epochs=10, batch_size=32, validation_split=0.2):
        """Train the model"""
        print(f"\nTraining {self.model_type} model...")
        
        # Load data
        if self.model_type == 'digits':
            (x_train, y_train), (x_test, y_test) = self.load_mnist()
        elif self.model_type == 'alphabets':
            (x_train, y_train), (x_test, y_test) = self.load_emnist()
        else:
            (x_train, y_train), (x_test, y_test) = self.load_combined()
        
        # Create model
        self.model = self.create_model()
        print(f"Model created with {self.model.count_params():,} parameters")
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
            keras.callbacks.ModelCheckpoint(
                f'best_{self.model_type}_model.h5',
                save_best_only=True,
                monitor='val_accuracy'
            )
        ]
        
        # Train
        print(f"\nStarting training for {epochs} epochs...")
        self.history = self.model.fit(
            x_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate
        print("\nEvaluating model...")
        test_loss, test_accuracy = self.model.evaluate(x_test, y_test, verbose=0)
        print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
        print(f"Test Loss: {test_loss:.4f}")
        
        # Generate classification report
        y_pred = np.argmax(self.model.predict(x_test, verbose=0), axis=1)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=self.classes[:len(np.unique(y_test))]))
        
        return {
            'accuracy': test_accuracy,
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_score': report['weighted avg']['f1-score'],
            'training_loss': self.history.history['loss'][-1],
            'validation_loss': self.history.history['val_loss'][-1],
        }
    
    def save_model(self, path):
        """Save the trained model"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.model.save(path)
        print(f"\nModel saved to {path}")
    
    def plot_training_history(self, save_path=None):
        """Plot training history"""
        if self.history is None:
            print("No training history to plot")
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Plot loss
        ax1.plot(self.history.history['loss'], label='Training Loss')
        ax1.plot(self.history.history['val_loss'], label='Validation Loss')
        ax1.set_title('Model Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.legend()
        
        # Plot accuracy
        ax2.plot(self.history.history['accuracy'], label='Training Accuracy')
        ax2.plot(self.history.history['val_accuracy'], label='Validation Accuracy')
        ax2.set_title('Model Accuracy')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Accuracy')
        ax2.legend()
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            print(f"Training history plot saved to {save_path}")
        else:
            plt.show()


def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train handwritten character recognition model')
    parser.add_argument('--model-type', type=str, default='combined',
                        choices=['digits', 'alphabets', 'combined'],
                        help='Type of model to train')
    parser.add_argument('--epochs', type=int, default=10,
                        help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Batch size for training')
    parser.add_argument('--output-dir', type=str, default='./ml/models',
                        help='Directory to save the model')
    
    args = parser.parse_args()
    
    # Create model trainer
    trainer = CharacterRecognitionModel(model_type=args.model_type)
    
    # Train model
    metrics = trainer.train(
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_split=0.2
    )
    
    # Save model
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    model_path = os.path.join(args.output_dir, f'{args.model_type}_model_{timestamp}.h5')
    trainer.save_model(model_path)
    
    # Save metrics
    metrics_path = os.path.join(args.output_dir, f'{args.model_type}_metrics_{timestamp}.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")
    
    # Plot training history
    plot_path = os.path.join(args.output_dir, f'{args.model_type}_history_{timestamp}.png')
    trainer.plot_training_history(save_path=plot_path)
    
    print("\nTraining completed successfully!")
    print(f"Final Accuracy: {metrics['accuracy'] * 100:.2f}%")
    print(f"Final F1 Score: {metrics['f1_score'] * 100:.2f}%")


if __name__ == '__main__':
    main()
