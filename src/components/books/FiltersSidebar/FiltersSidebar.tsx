'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Book } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './FiltersSidebar.module.css';

export interface Filters {
  search: string;
  categories: string[];
  tags: string[];
  authors: string[];
  year: string;
  yearFrom: string;
  yearTo: string;
}

interface FiltersSidebarProps {
  books: Book[];
  onFilterChange: (filters: Filters) => void;
}

export default function FiltersSidebar({ books, onFilterChange }: FiltersSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getParam = (name: string): string => {
    try {
      return searchParams?.get(name) ?? '';
    } catch {
      return '';
    }
  };

  const getInitialArray = (paramName: string): string[] => {
    const val = getParam(paramName);
    return val ? val.split(',').filter((x) => x.trim().length > 0) : [];
  };

  const [search, setSearch] = useState<string>(getParam('search'));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    getInitialArray('categories')
  );
  const [selectedYear, setSelectedYear] = useState<string>(getParam('year') || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(() => getInitialArray('tags'));
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(() =>
    getInitialArray('authors')
  );
  const [yearFrom, setYearFrom] = useState<string>(getParam('yearFrom'));
  const [yearTo, setYearTo] = useState<string>(getParam('yearTo'));

  const searchTimeoutRef = useRef<number | null>(null);

  // --- УНИКАЛЬНЫЕ КАТЕГОРИИ ---
  const categories = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          books
            .map((b) => b.category ?? '')
            .filter((c): c is string => c.trim().length > 0)
        )
      ),
    [books]
  );

  // --- ТЕГИ ---
  const tags = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          books
            .flatMap((b) => (Array.isArray(b.tags) ? b.tags : []))
            .filter((t): t is string => t.trim().length > 0)
        )
      ).slice(0, 10),
    [books]
  );

  // --- АВТОРЫ ---
  const authors = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          books
            .map((b) => b.author ?? '')
            .filter((a): a is string => a.trim().length > 0)
        )
      ),
    [books]
  );

  const toggleInArray = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  // --- APPLY FILTERS ---
  const applyFilters = useCallback(() => {
    const filters: Filters = {
      search: search.trim(),
      categories: selectedCategories,
      year: selectedYear,
      tags: selectedTags,
      authors: selectedAuthors,
      yearFrom: yearFrom.trim(),
      yearTo: yearTo.trim(),
    };

    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.categories.length) params.set('categories', filters.categories.join(','));
    if (filters.year && filters.year !== 'all') params.set('year', filters.year);
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.authors.length) params.set('authors', filters.authors.join(','));
    if (filters.yearFrom) params.set('yearFrom', filters.yearFrom);
    if (filters.yearTo) params.set('yearTo', filters.yearTo);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;

    router.replace(newUrl);
    onFilterChange(filters);
  }, [
    search,
    selectedCategories,
    selectedYear,
    selectedTags,
    selectedAuthors,
    yearFrom,
    yearTo,
    router,
    onFilterChange,
  ]);

  // --- ДЕБАУНС ---
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = window.setTimeout(() => {
      applyFilters();
      searchTimeoutRef.current = null;
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [
    search,
    selectedCategories,
    selectedYear,
    selectedTags,
    selectedAuthors,
    yearFrom,
    yearTo,
    applyFilters,
  ]);

  // --- CLEAR FILTERS ---
  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedYear('all');
    setSelectedTags([]);
    setSelectedAuthors([]);
    setYearFrom('');
    setYearTo('');

    router.replace(window.location.pathname);

    onFilterChange({
      search: '',
      categories: [],
      year: 'all',
      tags: [],
      authors: [],
      yearFrom: '',
      yearTo: '',
    });
  };

  return (
    <div className={styles.filtersSidebar}>
      <div className={styles.filtersHeader}>
        <h2>Фильтры</h2>
        <button className={styles.clearFilters} onClick={clearFilters} type="button">
          <i className="fas fa-times" /> Сбросить
        </button>
      </div>

      {/* Поиск */}
      <div className={styles.searchBox}>
        <i className="fas fa-search" />
        <input
          type="text"
          placeholder="Поиск книг..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              applyFilters();
            }
          }}
        />
      </div>

      {/* Категории */}
      {categories.length > 0 && (
        <div className={styles.filterGroup}>
          <div className={styles.filterTitle}>
            <i className="fas fa-tag" />
            <span>Категории</span>
          </div>
          <div className={styles.filterOptions}>
            {categories.map((category) => (
              <label key={category} className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => setSelectedCategories((prev) => toggleInArray(prev, category))}
                />
                {category}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Год */}
      <div className={styles.filterGroup}>
        <div className={styles.filterTitle}>
          <i className="fas fa-calendar" />
          <span>Год издания</span>
        </div>

        <div className={styles.filterOptions}>
          {[
            { id: 'all', label: 'Все года' },
            { id: '2025', label: '2025' },
            { id: '2024', label: '2024' },
            { id: '2023-2021', label: '2023-2021' },
            { id: 'old', label: 'До 2021' },
          ].map((opt) => (
            <label key={opt.id} className={styles.filterOption}>
              <input
                type="radio"
                name="year"
                checked={selectedYear === opt.id}
                onChange={() => setSelectedYear(opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        <div className={styles.yearRange}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="От"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <span>—</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="До"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      {/* Авторы */}
      {authors.length > 0 && (
        <div className={styles.filterGroup}>
          <div className={styles.filterTitle}>
            <i className="fas fa-user" />
            <span>Авторы</span>
          </div>
          <div className={styles.filterOptions}>
            {authors.slice(0, 5).map((author) => (
              <label key={author} className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedAuthors.includes(author)}
                  onChange={() => setSelectedAuthors((prev) => toggleInArray(prev, author))}
                />
                {author}
              </label>
            ))}
            {authors.length > 5 && (
              <div className={styles.moreAuthors}>
                <i className="fas fa-ellipsis-h" /> ещё {authors.length - 5} авторов
              </div>
            )}
          </div>
        </div>
      )}

      {/* Теги */}
      {tags.length > 0 && (
        <div className={styles.filterGroup}>
          <div className={styles.filterTitle}>
            <i className="fas fa-hashtag" />
            <span>Популярные теги</span>
          </div>
          <div className={styles.tagsContainer}>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.active : ''}`}
                onClick={() => setSelectedTags((prev) => toggleInArray(prev, tag))}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className={styles.applyButton} onClick={applyFilters} type="button">
        <i className="fas fa-filter" /> Применить фильтры
      </button>
    </div>
  );
}
