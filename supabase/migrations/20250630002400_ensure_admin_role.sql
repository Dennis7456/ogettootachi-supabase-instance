-- Update existing roles to valid values
UPDATE public.profiles 
SET role = 'staff' 
WHERE role IS NULL OR role NOT IN ('admin', 'staff', 'manager');

-- Create a function to set admin role
CREATE OR REPLACE FUNCTION public.set_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set role to 'admin' for users with admin email domain
  IF NEW.email LIKE '%@ogetto-otachi.com' THEN
    NEW.role = 'admin';
  END IF;
  
  -- Ensure role is always set to a valid value
  IF NEW.role IS NULL OR NEW.role NOT IN ('admin', 'staff', 'manager') THEN
    NEW.role = 'staff';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set admin role
CREATE TRIGGER set_admin_role_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_role();

-- Add a check constraint for roles
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('admin', 'staff', 'manager')); 