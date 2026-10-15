import type { ManagedLibraryAsset } from "@alrisali/api/library-assets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";
import { Switch } from "@/shared/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { AssetDialog } from "../components/asset-dialog";
import { ConfirmDeleteDialog } from "../components/confirm-delete-dialog";
import { CATEGORY_LABELS, KIND_LABELS } from "../utils/labels";
import { formatFileSize, libraryTable } from "../utils/library-table";

/**
 * Every Library Asset, unpublished ones too, by category and order: add,
 * edit, publish, unpublish and delete.
 */
export const LibraryScreen = () => {
  const queryClient = useQueryClient();
  const list = useQuery(orpc.libraryAssets.list.queryOptions());
  /** The asset being edited, "new" while adding one. */
  const [editing, setEditing] = useState<ManagedLibraryAsset | "new" | null>(
    null
  );
  const [deleting, setDeleting] = useState<ManagedLibraryAsset | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: orpc.libraryAssets.list.queryKey(),
    });

  const setPublished = useMutation(
    orpc.libraryAssets.setPublished.mutationOptions({
      onSuccess: async (asset) => {
        await refresh();
        toast.success(
          asset.published
            ? `Published ${asset.title.ar}. Devices get it on their next sync.`
            : `Unpublished ${asset.title.ar}. Devices drop it on their next sync.`
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const remove = useMutation(
    orpc.libraryAssets.remove.mutationOptions({
      onSuccess: async () => {
        await refresh();
        toast.success(
          `Deleted ${deleting?.title.ar ?? "the Library Asset"}. Devices update on their next sync.`
        );
        setDeleting(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleting(null);
      },
    })
  );

  if (list.isPending) {
    return <Loader />;
  }
  if (list.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Library: {list.error.message}
      </p>
    );
  }

  const { assets, previews } = list.data;
  const shelves = libraryTable(assets);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Library</h1>
          <p className="text-muted-foreground">
            Books, recordings, videos and structured texts. Published ones reach
            every device on its next sync; unpublished ones stay only on the
            server and never reach devices.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>Add Library Asset</Button>
      </div>

      {shelves.length === 0 ? (
        <p className="text-muted-foreground border p-4 text-sm">
          No Library Assets yet.
        </p>
      ) : (
        shelves.map(({ category, assets: onShelf }) => (
          <section
            key={category}
            className="flex flex-col gap-3"
            aria-labelledby={`library-${category}`}
          >
            <h2 id={`library-${category}`} className="text-lg font-semibold">
              {CATEGORY_LABELS[category]}
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onShelf.map((asset) => {
                  const cover = asset.coverKey
                    ? previews[asset.coverKey]
                    : undefined;
                  const file = previews[asset.fileKey];
                  const toggling =
                    setPublished.isPending &&
                    setPublished.variables.id === asset.id;
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="h-16 w-12 border object-cover"
                          />
                        ) : (
                          <div className="bg-muted h-16 w-12 border" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div lang="ar" dir="rtl" className="text-left">
                          {asset.title.ar}
                        </div>
                        {asset.title.en ? (
                          <div className="text-muted-foreground">
                            {asset.title.en}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {asset.author.ar || asset.author.en ? (
                          <>
                            <div lang="ar" dir="rtl" className="text-left">
                              {asset.author.ar}
                            </div>
                            {asset.author.en ? (
                              <div className="text-muted-foreground">
                                {asset.author.en}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {KIND_LABELS[asset.kind]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatFileSize(asset.fileSize)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {asset.order}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={asset.published}
                          disabled={toggling}
                          aria-label={`Published: ${asset.title.ar}`}
                          onCheckedChange={(published) =>
                            setPublished.mutate({ id: asset.id, published })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {file ? (
                            <a
                              href={file}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
                              Open
                            </a>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(asset)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleting(asset)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        ))
      )}

      {editing === null ? null : (
        <AssetDialog
          key={editing === "new" ? "new" : editing.id}
          asset={editing === "new" ? null : editing}
          assets={assets}
          previews={previews}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeleteDialog
        name={deleting?.title.ar ?? null}
        description="Devices drop this Library Asset on their next sync. To hide it for now and keep it, unpublish it instead."
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            remove.mutate({ id: deleting.id });
          }
        }}
      />
    </main>
  );
};
