'use client';

import { Book } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './BookCard.module.css';
import Link from 'next/link';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  // безопасные значения по умолчанию
  const bookId = book.id ?? '';
  const title = book.title ?? 'Без названия';
  const author = book.author ?? 'Неизвестный автор';
  const category = book.category ?? 'Не указано';
  const year = book.year ?? 0;
  const pages = book.pages ?? 0;
  const description = book.description ?? '';
  const tags = book.tags ?? [];

  // Проверяем, добавлена ли книга в избранное при загрузке
  const checkIfFavorite = useCallback(async () => {
    if (!user || !bookId) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (error) {
        console.error('Ошибка проверки избранного:', error);
        return;
      }

      if (data) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (err) {
      console.error('Ошибка проверки избранного:', err);
    }
  }, [user, bookId]);

  useEffect(() => {
    if (user && bookId) {
      checkIfFavorite();
    }
  }, [user, bookId, checkIfFavorite]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      alert('Войдите в аккаунт, чтобы добавлять книги в избранное');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite && favoriteId) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favoriteId);

        if (error) throw error;

        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            book_id: bookId,
            book_title: title,
            book_author: author,
            book_category: category,
            book_year: year,
            book_pages: pages,
            book_description: description,
            book_tags: tags,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            await checkIfFavorite();
          } else {
            throw error;
          }
        } else if (data) {
          setIsFavorite(true);
          setFavoriteId(data.id);
        }
      }
    } catch (err) {
      console.error('Ошибка избранного:', err);
      const errorObj = err as Error;
      alert(errorObj.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Book info:', book);
  };

  const canAddToFavorites = user && bookId;

  return (
    <div className={styles.bookCard}>
      <div className={styles.bookImage}>
        <i className="fas fa-code"></i>
        {year >= 2024 && <span className={styles.bookBadge}>Новинка</span>}
      </div>

      <div className={styles.bookContent}>
        <h3 className={styles.bookTitle}>{title}</h3>
        <p className={styles.bookAuthor}>{author}</p>
        <p className={styles.bookYear}>
          {year} • {pages} страниц
        </p>

        <div className={styles.bookTags}>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.bookTag}>
              {tag}
            </span>
          ))}
        </div>

        <p className={styles.bookDescription}>
          {description.length > 120 ? `${description.substring(0, 120)}...` : description}
        </p>

        <div className={styles.bookActions}>
          <Link
            href={`/literature/${bookId}`}
            className={styles.btnPrimary}
            title="Читать книгу"
          >
            <i className="fas fa-book-open"></i> Читать
          </Link>

          <button className={styles.btnOutline} onClick={handleInfoClick} title="Подробная информация">
            <i className="fas fa-info-circle"></i>
          </button>

          {canAddToFavorites ? (
            <button
              className={`${styles.btnOutline} ${isFavorite ? styles.favoriteActive : ''}`}
              onClick={handleFavoriteClick}
              disabled={isLoading}
              title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : isFavorite ? (
                <i className="fas fa-heart"></i>
              ) : (
                <i className="far fa-heart"></i>
              )}
            </button>
          ) : (
            <button
              className={styles.btnOutline}
              onClick={(e) => {
                e.stopPropagation();
                alert('Войдите в аккаунт, чтобы добавлять книги в избранное');
              }}
              title="Войдите, чтобы добавить в избранное"
            >
              <i className="far fa-heart"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
