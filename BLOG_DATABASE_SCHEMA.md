# Blog Database Schema

## Overview
The blog management system uses two main tables: `blog_posts` and `blog_post_files`. These tables are designed to support a comprehensive content management system with proper security, performance, and data integrity.

## Tables

### 1. blog_posts Table

**Purpose**: Stores all blog post content and metadata.

**Schema**:
```sql
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    featured_image_url TEXT,
    read_time INTEGER DEFAULT 5,
    resource_type VARCHAR(50),
    is_public BOOLEAN DEFAULT true,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **UUID Primary Key**: Unique identifier for each post
- **Rich Content Support**: Full text content with HTML support
- **SEO Fields**: Meta title and description for search optimization
- **Categorization**: Category and tags for organization
- **Status Management**: Draft, published, archived states
- **Legal Resources**: Special fields for legal resource types
- **Public/Private**: Control over resource visibility
- **Author Tracking**: Links to auth.users table
- **Auto-generated Slugs**: SEO-friendly URLs
- **Timestamps**: Created and updated tracking

**Indexes**:
```sql
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
```

### 2. blog_post_files Table

**Purpose**: Stores file attachments for blog posts.

**Schema**:
```sql
CREATE TABLE blog_post_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **Foreign Key Relationship**: Links to blog_posts with CASCADE delete
- **File Metadata**: Name, type, size tracking
- **Storage URL**: Points to Supabase storage
- **Automatic Cleanup**: Files deleted when post is deleted

**Indexes**:
```sql
CREATE INDEX idx_blog_post_files_blog_post_id ON blog_post_files(blog_post_id);
CREATE INDEX idx_blog_post_files_file_type ON blog_post_files(file_type);
CREATE INDEX idx_blog_post_files_created_at ON blog_post_files(created_at);
```

## Security (Row Level Security)

### blog_posts RLS Policies

1. **Public Read Access**:
   ```sql
   CREATE POLICY "Public can read published blog posts" ON blog_posts
       FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
   ```

2. **Authenticated Create Access**:
   ```sql
   CREATE POLICY "Authenticated users can create blog posts" ON blog_posts
       FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
   ```

3. **Author Update Access**:
   ```sql
   CREATE POLICY "Authors can update their own blog posts" ON blog_posts
       FOR UPDATE USING (auth.uid() = author_id);
   ```

4. **Author Delete Access**:
   ```sql
   CREATE POLICY "Authors can delete their own blog posts" ON blog_posts
       FOR DELETE USING (auth.uid() = author_id);
   ```

### blog_post_files RLS Policies

1. **Conditional Read Access**:
   ```sql
   CREATE POLICY "Public can read files of published blog posts" ON blog_post_files
       FOR SELECT USING (
           EXISTS (
               SELECT 1 FROM blog_posts 
               WHERE blog_posts.id = blog_post_files.blog_post_id 
               AND (blog_posts.status = 'published' OR blog_posts.author_id = auth.uid())
           )
       );
   ```

2. **Author File Management**:
   ```sql
   CREATE POLICY "Authors can add files to their own blog posts" ON blog_post_files
       FOR INSERT WITH CHECK (
           EXISTS (
               SELECT 1 FROM blog_posts 
               WHERE blog_posts.id = blog_post_files.blog_post_id 
               AND blog_posts.author_id = auth.uid()
           )
       );
   ```

## Automatic Features

### 1. Slug Generation
```sql
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'))
           || '-' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql;
```

### 2. Auto-generated Slugs
```sql
CREATE TRIGGER trigger_set_slug
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION set_slug();
```

### 3. Updated Timestamp
```sql
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Data Types and Constraints

### blog_posts Constraints
- **Status Check**: Only 'draft', 'published', 'archived' allowed
- **Meta Title Length**: Maximum 60 characters (SEO best practice)
- **Meta Description Length**: Maximum 160 characters (SEO best practice)
- **Read Time**: Default 5 minutes, integer
- **Tags**: Array of text strings
- **Slug**: Unique constraint for SEO-friendly URLs

### blog_post_files Constraints
- **File Size**: BIGINT for large file support
- **File Type**: VARCHAR(100) for MIME type storage
- **Cascade Delete**: Files automatically deleted when post is deleted

## Performance Optimizations

### Indexes
- **Author-based queries**: `idx_blog_posts_author_id`
- **Status filtering**: `idx_blog_posts_status`
- **Category filtering**: `idx_blog_posts_category`
- **Date sorting**: `idx_blog_posts_created_at`
- **Slug lookups**: `idx_blog_posts_slug`
- **File relationships**: `idx_blog_post_files_blog_post_id`

### Query Optimization
- **Efficient joins**: Foreign key relationships
- **Array operations**: Tags stored as TEXT[] for efficient searching
- **Partial indexes**: Status-based filtering
- **Composite queries**: Author + status combinations

## Usage Examples

### Create a Blog Post
```sql
INSERT INTO blog_posts (
    title, excerpt, content, category, tags, 
    meta_title, meta_description, author_id
) VALUES (
    'Legal Guide: Contract Law Basics',
    'Essential principles of contract law for businesses',
    '<p>Contract law governs agreements between parties...</p>',
    'Legal Resources - Guides',
    ARRAY['contracts', 'business', 'legal'],
    'Contract Law Basics - Legal Guide',
    'Essential principles of contract law for businesses and individuals',
    'auth_user_uuid_here'
);
```

### Query Published Posts
```sql
SELECT 
    bp.*,
    array_agg(bpf.file_name) as attached_files
FROM blog_posts bp
LEFT JOIN blog_post_files bpf ON bp.id = bpf.blog_post_id
WHERE bp.status = 'published'
GROUP BY bp.id
ORDER BY bp.created_at DESC;
```

### Get Posts by Category
```sql
SELECT * FROM blog_posts 
WHERE category LIKE 'Legal Resources%' 
AND status = 'published'
ORDER BY created_at DESC;
```

## Migration Files

1. **20250801170000_create_blog_posts_table.sql**: Creates the main blog posts table
2. **20250801181000_create_blog_post_files_table.sql**: Creates the file attachments table

Both migrations include:
- Table creation with proper constraints
- Index creation for performance
- RLS policies for security
- Triggers for automatic features
- Permission grants for authenticated users

This schema provides a robust foundation for the blog management system with proper security, performance, and data integrity. 