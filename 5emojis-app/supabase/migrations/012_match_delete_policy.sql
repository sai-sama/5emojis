-- Allow users to delete matches they are part of (needed for block + unmatch).
-- Messages and reactions cascade-delete automatically via FK constraints.
CREATE POLICY "Users can delete their own matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());
