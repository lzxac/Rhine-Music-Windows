<#
.SYNOPSIS
  Rebuilds desktop/app.ico from desktop/app-icon-source.png.

.DESCRIPTION
  The owner's artwork carries a painted dark vignette instead of an alpha channel,
  so this script also applies a real rounded-corner mask before writing the icon.
  The radius and the tile inset are measured from the artwork itself:

    1254px canvas -> corner arc radius 161px = 12.84% of the canvas
    1254px canvas -> straight tile edge sits 9px in = 0.717% of the canvas

  Every size is written as an uncompressed 32bpp bitmap entry (DIB). PNG-compressed
  icon entries are deliberately avoided: System.Drawing cannot read them, and the
  plain bitmap form is what the shell and older tooling handle most reliably.

  The mask is rasterised at 4x and downscaled so the rounded edge stays smooth.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-app-icon.ps1
#>
param(
  [string]$Source,
  [string]$Icon,
  [string]$PreviewDir
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (-not $Source) { $Source = Join-Path $root 'desktop\app-icon-source.png' }
if (-not $Icon) { $Icon = Join-Path $root 'desktop\app.ico' }

if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Source artwork not found: $Source" }

Add-Type @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class RhineAppIcon
{
    const double RadiusFraction = 0.1284;
    const double InsetFraction = 0.00717;

    static GraphicsPath RoundedRect(RectangleF r, float radius)
    {
        var path = new GraphicsPath();
        float d = radius * 2;
        path.AddArc(r.X, r.Y, d, d, 180, 90);
        path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    public static Bitmap RoundCorners(Bitmap source, int size)
    {
        var result = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(result))
        {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.DrawImage(source, new Rectangle(0, 0, size, size));
        }
        int super = 4;
        using (var mask = new Bitmap(size * super, size * super, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(mask))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                float inset = (float)(InsetFraction * size) * super;
                float radius = (float)(RadiusFraction * size) * super;
                var rect = new RectangleF(inset, inset, size * super - inset * 2 - 1, size * super - inset * 2 - 1);
                using (var path = RoundedRect(rect, radius))
                using (var brush = new SolidBrush(Color.White))
                    g.FillPath(brush, path);
            }
            using (var maskSmall = new Bitmap(size, size, PixelFormat.Format32bppArgb))
            {
                using (var g = Graphics.FromImage(maskSmall))
                {
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.DrawImage(mask, new Rectangle(0, 0, size, size));
                }
                for (int y = 0; y < size; y++)
                    for (int x = 0; x < size; x++)
                    {
                        var pixel = result.GetPixel(x, y);
                        var maskPixel = maskSmall.GetPixel(x, y);
                        result.SetPixel(x, y, Color.FromArgb(pixel.A * maskPixel.R / 255, pixel.R, pixel.G, pixel.B));
                    }
            }
        }
        return result;
    }

    static byte[] DibEntry(Bitmap bmp)
    {
        int w = bmp.Width, h = bmp.Height;
        using (var stream = new MemoryStream())
        using (var writer = new BinaryWriter(stream))
        {
            writer.Write(40); writer.Write(w); writer.Write(h * 2);
            writer.Write((short)1); writer.Write((short)32);
            writer.Write(0); writer.Write(w * h * 4);
            writer.Write(0); writer.Write(0); writer.Write(0); writer.Write(0);
            for (int y = h - 1; y >= 0; y--)
                for (int x = 0; x < w; x++)
                {
                    var c = bmp.GetPixel(x, y);
                    writer.Write(c.B); writer.Write(c.G); writer.Write(c.R); writer.Write(c.A);
                }
            int stride = ((w + 31) / 32) * 4;
            var zeros = new byte[stride];
            for (int y = 0; y < h; y++) writer.Write(zeros, 0, stride);
            writer.Flush();
            return stream.ToArray();
        }
    }

    public static string Build(string sourcePath, string icoPath, string previewDir)
    {
        int[] sizes = { 16, 20, 24, 32, 40, 48, 64, 128, 256 };
        var images = new List<byte[]>();
        using (var raw = new Bitmap(Image.FromFile(sourcePath)))
        using (var source = new Bitmap(raw.Width, raw.Height, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(source)) g.DrawImageUnscaled(raw, 0, 0);
            foreach (var size in sizes)
            {
                using (var rounded = RoundCorners(source, size))
                {
                    images.Add(DibEntry(rounded));
                    if (previewDir != null)
                    {
                        Directory.CreateDirectory(previewDir);
                        rounded.Save(Path.Combine(previewDir, "app-icon-" + size + ".png"), ImageFormat.Png);
                    }
                }
            }
        }
        using (var stream = new FileStream(icoPath, FileMode.Create, FileAccess.Write))
        using (var writer = new BinaryWriter(stream))
        {
            writer.Write((short)0); writer.Write((short)1); writer.Write((short)sizes.Length);
            int offset = 6 + 16 * sizes.Length;
            for (int i = 0; i < sizes.Length; i++)
            {
                writer.Write((byte)(sizes[i] == 256 ? 0 : sizes[i]));
                writer.Write((byte)(sizes[i] == 256 ? 0 : sizes[i]));
                writer.Write((byte)0); writer.Write((byte)0);
                writer.Write((short)1); writer.Write((short)32);
                writer.Write(images[i].Length); writer.Write(offset);
                offset += images[i].Length;
            }
            foreach (var image in images) writer.Write(image);
        }
        return "wrote " + icoPath + " (" + new FileInfo(icoPath).Length + " bytes, " + sizes.Length + " sizes)";
    }
}
'@ -ReferencedAssemblies System.Drawing

[RhineAppIcon]::Build((Resolve-Path -LiteralPath $Source).Path, [IO.Path]::GetFullPath($Icon), $PreviewDir)
