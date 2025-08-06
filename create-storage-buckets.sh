#!/bin/bash

echo "Creating storage buckets for blog management..."

# Create blog-images bucket
echo "Creating blog-images bucket..."
supabase storage create-bucket blog-images --public --file-size-limit 5242880

# Create blog-documents bucket  
echo "Creating blog-documents bucket..."
supabase storage create-bucket blog-documents --public --file-size-limit 10485760

echo "Storage buckets created successfully!"
echo "You may need to configure RLS policies manually in the Supabase dashboard." 