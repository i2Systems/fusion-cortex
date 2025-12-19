#!/usr/bin/env python3
"""
PDF Vector Extractor using PyMuPDF (fitz) - PRODUCTION VERSION
Uses comprehensive extraction with multiple methods
Based on debug version testing
"""

import sys
import json
import fitz  # PyMuPDF
from pathlib import Path

# Optional imports for advanced line detection
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from scipy import ndimage
    from skimage import measure, morphology
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

def extract_pdf_vectors(pdf_path: str) -> dict:
    """
    Extract vector data from PDF using PyMuPDF
    Returns JSON with paths, text, and SVG representation
    """
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]  # First page
        
        # Get page dimensions
        rect = page.rect
        width = rect.width
        height = rect.height
        
        # Use get_displaylist() method - most reliable and comprehensive
        paths = []
        path_signatures = set()  # For deduplication
        
        def add_path_if_new(path_obj):
            """Add path only if we haven't seen it before (intelligent deduplication)"""
            # Create more robust signature - use first few points rounded to avoid float precision issues
            if len(path_obj.get('points', [])) == 0:
                return False
            points_str = ','.join([f"{p:.1f}" for p in path_obj['points'][:10]])  # First 5 points, rounded
            sig = f"{path_obj['type']}_{points_str}_{path_obj.get('stroke', '')}_{path_obj.get('strokeWidth', 0):.2f}"
            if sig not in path_signatures:
                path_signatures.add(sig)
                paths.append(path_obj)
                return True
            return False
        
        # Use get_displaylist() - most reliable method for comprehensive extraction
        try:
            display_list = page.get_displaylist()
            zoom = 4.0
            mat = fitz.Matrix(zoom, zoom)
            pix_dl = display_list.get_pixmap(matrix=mat, alpha=False)
            print(f"Rendered pixmap: {pix_dl.width}x{pix_dl.height}, n={pix_dl.n}", file=sys.stderr)
            path_count_before = len(paths)
            extract_lines_from_pixmap(pix_dl, zoom, height, add_path_if_new)
            path_count_after = len(paths)
            print(f"Extracted {path_count_after - path_count_before} paths from pixmap", file=sys.stderr)
        except Exception as e:
            print(f"Extraction failed: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
        
        # ========== TEXT EXTRACTION ==========
        # Use get_text("dict") to extract text with proper font information
        # NOTE: PyMuPDF uses top-left origin (like canvas/images), NOT PDF's bottom-left origin
        # So bbox coordinates are already in the correct orientation - no flipping needed!
        texts = []
        try:
            import math
            text_dict = page.get_text("dict")
            for block in text_dict.get("blocks", []):
                if "lines" in block:
                    for line in block["lines"]:
                        # Get text direction from line - dir is (dx, dy) unit vector
                        # (1, 0) = horizontal left-to-right, (0, 1) = vertical top-to-bottom
                        line_dir = line.get("dir", (1, 0))
                        
                        # Calculate rotation angle in degrees from direction vector
                        # atan2(dy, dx) gives angle from positive x-axis
                        rotation = math.degrees(math.atan2(line_dir[1], line_dir[0]))
                        
                        for span in line.get("spans", []):
                            bbox = span.get("bbox", [0, 0, 0, 0])
                            text_content = span.get("text", "").strip()
                            
                            if not text_content:
                                continue
                            
                            # Use the EXACT font size from the PDF - no modification
                            # This ensures 1:1 match with original PDF rendering
                            fontSize = span.get("size", 1.0)
                            
                            # PyMuPDF bbox is in top-left origin coordinates (same as canvas)
                            # bbox = [x0, y0, x1, y1] where (x0, y0) is top-left of text box
                            # Use bbox for positioning - Konva positions text from top-left
                            texts.append({
                                "x": bbox[0],
                                "y": bbox[1],  # Top of text box - works directly with Konva
                                "text": text_content,
                                "fontSize": fontSize,
                                "fontName": span.get("font", "Arial"),
                                "rotation": rotation  # Rotation angle in degrees
                            })
        except Exception as e:
            print(f"Text extraction failed: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
        
        doc.close()
        
        # Post-process: Merge collinear lines to reduce render count and improve performance
        paths = merge_collinear_lines(paths)
        
        return {
            "texts": texts,
            "paths": paths,
            "bounds": {
                "width": width,
                "height": height
            },
            "isVector": len(paths) > 0 or len(texts) > 10,
        }
    except Exception as e:
        print(f"CRITICAL ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "texts": [],
            "paths": [],
            "bounds": {"width": 0, "height": 0},
            "isVector": False
        }

def merge_collinear_lines(paths):
    """Merge collinear lines that share endpoints to reduce render count"""
    if not paths or len(paths) < 2:
        return paths
    
    # Separate lines from other path types
    lines = []
    other_paths = []
    for path in paths:
        if path.get("type") == "line" and len(path.get("points", [])) >= 4:
            lines.append(path)
        else:
            other_paths.append(path)
    
    if not lines:
        return paths
    
    # Group lines by stroke color, width, and layer for efficient merging
    line_groups = {}
    for line in lines:
        key = (line.get("stroke", "#000000"), line.get("strokeWidth", 1), line.get("layer", "base_building"))
        if key not in line_groups:
            line_groups[key] = []
        line_groups[key].append(line)
    
    merged_lines = []
    
    for key, group_lines in line_groups.items():
        # Build connected line chains
        processed = set()
        
        for i, line1 in enumerate(group_lines):
            if i in processed:
                continue
            
            [x1, y1, x2, y2] = line1["points"]
            # Use tighter tolerance - scale factor is 1/zoom (0.25 for zoom=4.0)
            # So tolerance should be in original PDF units, not scaled units
            tolerance = 0.5  # Tighter tolerance to preserve shape integrity
            
            # Try to extend this line by finding connected lines
            merged_line = {"points": [x1, y1, x2, y2], "type": "line", "stroke": key[0], "strokeWidth": key[1], "layer": key[2]}
            changed = True
            
            while changed:
                changed = False
                for j, line2 in enumerate(group_lines):
                    if i == j or j in processed:
                        continue
                    
                    [ox1, oy1, ox2, oy2] = line2["points"]
                    [mx1, my1, mx2, my2] = merged_line["points"]
                    
                    # Check if line2 connects to merged_line
                    if abs(mx2 - ox1) < tolerance and abs(my2 - oy1) < tolerance:
                        # Merged line ends where line2 starts
                        merged_line["points"] = [mx1, my1, ox2, oy2]
                        processed.add(j)
                        changed = True
                    elif abs(mx1 - ox2) < tolerance and abs(my1 - oy2) < tolerance:
                        # Merged line starts where line2 ends
                        merged_line["points"] = [ox1, oy1, mx2, my2]
                        processed.add(j)
                        changed = True
                    elif abs(mx2 - ox2) < tolerance and abs(my2 - oy2) < tolerance:
                        # Merged line ends where line2 ends - reverse line2
                        merged_line["points"] = [mx1, my1, ox1, oy1]
                        processed.add(j)
                        changed = True
                    elif abs(mx1 - ox1) < tolerance and abs(my1 - oy1) < tolerance:
                        # Merged line starts where line2 starts - reverse merged
                        merged_line["points"] = [ox2, oy2, mx2, my2]
                        processed.add(j)
                        changed = True
            
            merged_lines.append(merged_line)
            processed.add(i)
    
    # Combine merged lines with other path types
    return merged_lines + other_paths

def get_layer_from_color(r, g, b, stroke_width=1):
    """Classify layer based on color and line width"""
    # Convert to grayscale value
    gray_value = (r * 0.2989 + g * 0.5870 + b * 0.1140)
    
    # Black or very dark = base building (walls/structure) or business marks (fixtures)
    if gray_value < 50:
        # Very thick lines are likely structural walls
        if stroke_width > 3:
            return "base_building"
        # Medium lines could be walls or major fixtures
        elif stroke_width > 1.5:
            return "base_building"
        # Thin black lines are likely fixtures, lights, or business marks
        else:
            return "base_building"
    # Medium grey = annotations/dimensions
    elif gray_value < 150:
        return "annotations"
    # Light grey = grid lines or very light annotations
    elif gray_value < 200:
        return "grid_lines"  # Changed from "annotations" to "grid_lines"
    # Very light = ignore (background)
    else:
        return None

def rgb_to_hex(r, g, b):
    """Convert RGB to hex color"""
    return f"#{int(r):02x}{int(g):02x}{int(b):02x}"

def detect_stroke_width(pix, x, y, gray, threshold, is_horizontal=True):
    """Detect actual stroke width by scanning perpendicular to line"""
    if not HAS_NUMPY:
        return 1.0  # Fallback
    
    width = 1
    # Scan perpendicular to line direction
    if is_horizontal:
        # For horizontal lines, scan vertically (up and down)
        for offset in range(1, 10):  # Check up to 10 pixels
            if y + offset < gray.shape[0] and gray[y + offset, x] < threshold:
                width += 1
            else:
                break
            if y - offset >= 0 and gray[y - offset, x] < threshold:
                width += 1
            else:
                break
    else:
        # For vertical lines, scan horizontally (left and right)
        for offset in range(1, 10):
            if x + offset < gray.shape[1] and gray[y, x + offset] < threshold:
                width += 1
            else:
                break
            if x - offset >= 0 and gray[y, x - offset] < threshold:
                width += 1
            else:
                break
    return max(1, width)

def extract_lines_from_pixmap(pix, zoom, height, add_path_if_new):
    """Extract lines from rendered pixmap - comprehensive method
    
    COORDINATE SYSTEM NOTE:
    - PyMuPDF pixmaps use top-left origin (like images/canvas)
    - Pixel (0, 0) = top-left of rendered page
    - No Y-flip needed! Just scale pixmap coords to PDF coords.
    
    STROKE WIDTH NOTE:
    - We detect stroke width from pixels, but anti-aliasing inflates this
    - Apply a correction factor to get closer to original PDF stroke widths
    - Most architectural drawings use 0.1-0.5 point strokes
    """
    count = 0
    scale_factor = 1.0 / zoom
    threshold = 240  # Capture both dark and grey lines (higher threshold)
    # Minimum line length in PDF coordinates (not pixmap coordinates)
    min_line_length_pdf = 0.5  # Minimum 0.5 PDF units to avoid noise
    # Stroke width correction factor (anti-aliasing makes lines appear ~2x wider)
    stroke_correction = 0.5
    # Minimum stroke width - use a very small value to preserve hairlines
    min_stroke_width = 0.1
    
    try:
        if HAS_NUMPY:
            # Use numpy for efficient processing
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            
            # Get RGB channels for color detection
            if pix.n == 3:
                r_channel = img_data[:,:,0]
                g_channel = img_data[:,:,1]
                b_channel = img_data[:,:,2]
                gray = np.dot(img_data[...,:3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)
            elif pix.n == 1:
                r_channel = g_channel = b_channel = img_data[:,:,0]
                gray = img_data[:,:,0]
            else:
                r_channel = g_channel = b_channel = img_data[:,:,0] if len(img_data.shape) > 2 else img_data
                gray = img_data[:,:,0] if len(img_data.shape) > 2 else img_data
            
            # Horizontal line detection with gap tolerance for dashed lines
            gap_tolerance = 3
            for y in range(0, gray.shape[0], 1):  # Check every row for maximum coverage
                line_start = None
                gap_count = 0
                line_color = None
                line_layer = None
                for x in range(gray.shape[1]):
                    pixel_value = gray[y, x]
                    if pixel_value < threshold:
                        # Get color and layer for this pixel
                        r = int(r_channel[y, x])
                        g = int(g_channel[y, x])
                        b = int(b_channel[y, x])
                        # Estimate stroke width from context (will be refined when creating path)
                        estimated_width = 1 * scale_factor
                        layer = get_layer_from_color(r, g, b, estimated_width)
                        
                        if layer is None:  # Skip background
                            gap_count += 1
                            if gap_count > gap_tolerance and line_start is not None:
                                # End of line segment
                                line_length_pdf = (x - line_start - gap_count) * scale_factor
                                if line_length_pdf > min_line_length_pdf:
                                    x1 = line_start * scale_factor
                                    y1 = y * scale_factor  # No flip - pixmap already uses top-left origin
                                    x2 = (x - gap_count) * scale_factor
                                    y2 = y * scale_factor
                                    color = line_color or "#000000"
                                    # Detect stroke width - for horizontal lines, scan vertically at line_start
                                    detected_width = detect_stroke_width(pix, line_start, y, gray, threshold, is_horizontal=True)
                                    # Apply correction for anti-aliasing and scale to PDF units
                                    stroke_width_pdf = detected_width * scale_factor * stroke_correction
                                    if add_path_if_new({
                                        "type": "line",
                                        "points": [x1, y1, x2, y2],
                                        "stroke": color,
                                        "strokeWidth": max(min_stroke_width, stroke_width_pdf),
                                        "layer": line_layer or "base_building",
                                    }):
                                        count += 1
                                line_start = None
                                line_color = None
                                line_layer = None
                        else:
                            if line_start is None:
                                line_start = x
                                line_color = rgb_to_hex(r, g, b)
                                line_layer = layer
                            gap_count = 0
                    else:
                        gap_count += 1
                        if gap_count > gap_tolerance and line_start is not None:
                            # End of line segment
                            # Check minimum length in PDF coordinates, not pixmap coordinates
                            line_length_pdf = (x - line_start - gap_count) * scale_factor
                            if line_length_pdf > min_line_length_pdf:
                                x1 = line_start * scale_factor
                                y1 = y * scale_factor  # No flip - pixmap already uses top-left origin
                                x2 = (x - gap_count) * scale_factor
                                y2 = y * scale_factor
                                color = line_color or "#000000"
                                # Detect stroke width - for horizontal lines, scan vertically at line_start
                                detected_width = detect_stroke_width(pix, line_start, y, gray, threshold, is_horizontal=True)
                                stroke_width_pdf = detected_width * scale_factor * stroke_correction
                                if add_path_if_new({
                                    "type": "line",
                                    "points": [x1, y1, x2, y2],
                                    "stroke": color,
                                    "strokeWidth": max(min_stroke_width, stroke_width_pdf),
                                    "layer": line_layer or "base_building",
                                }):
                                    count += 1
                            line_start = None
                            line_color = None
                            line_layer = None
                
                # Handle line extending to edge
                if line_start is not None:
                    line_length_pdf = (gray.shape[1] - line_start) * scale_factor
                    if line_length_pdf > min_line_length_pdf:
                        x1 = line_start * scale_factor
                        y1 = y * scale_factor  # No flip - pixmap already uses top-left origin
                        x2 = gray.shape[1] * scale_factor
                        y2 = y * scale_factor
                        color = line_color or "#000000"
                        # Use detected stroke width from the line start
                        detected_width = detect_stroke_width(pix, line_start, y, gray, threshold, is_horizontal=True)
                        stroke_width_pdf = detected_width * scale_factor * stroke_correction
                        if add_path_if_new({
                            "type": "line",
                            "points": [x1, y1, x2, y2],
                            "stroke": color,
                            "strokeWidth": max(min_stroke_width, stroke_width_pdf),
                            "layer": line_layer or "base_building",
                        }):
                            count += 1
            
            # Vertical line detection with gap tolerance
            for x in range(0, gray.shape[1], 1):  # Check every column
                line_start = None
                gap_count = 0
                line_color = None
                line_layer = None
                for y in range(gray.shape[0]):
                    pixel_value = gray[y, x]
                    if pixel_value < threshold:
                        # Get color and layer for this pixel
                        r = int(r_channel[y, x])
                        g = int(g_channel[y, x])
                        b = int(b_channel[y, x])
                        # Estimate stroke width from context (will be refined when creating path)
                        estimated_width = 1 * scale_factor
                        layer = get_layer_from_color(r, g, b, estimated_width)
                        
                        if layer is None:  # Skip background
                            gap_count += 1
                            if gap_count > gap_tolerance and line_start is not None:
                                # End of line segment
                                line_length_pdf = (y - line_start - gap_count) * scale_factor
                                if line_length_pdf > min_line_length_pdf:
                                    x1 = x * scale_factor
                                    y1 = line_start * scale_factor  # No flip - pixmap uses top-left origin
                                    x2 = x * scale_factor
                                    y2 = (y - gap_count) * scale_factor
                                    color = line_color or "#000000"
                                    # Detect stroke width - for vertical lines, scan horizontally at line_start
                                    detected_width = detect_stroke_width(pix, x, line_start, gray, threshold, is_horizontal=False)
                                    stroke_width_pdf = detected_width * scale_factor * stroke_correction
                                    if add_path_if_new({
                                        "type": "line",
                                        "points": [x1, y1, x2, y2],
                                        "stroke": color,
                                        "strokeWidth": max(min_stroke_width, stroke_width_pdf),
                                        "layer": line_layer or "base_building",
                                    }):
                                        count += 1
                                line_start = None
                                line_color = None
                                line_layer = None
                        else:
                            if line_start is None:
                                line_start = y
                                line_color = rgb_to_hex(r, g, b)
                                line_layer = layer
                            gap_count = 0
                    else:
                        gap_count += 1
                        if gap_count > gap_tolerance and line_start is not None:
                            # End of line segment
                            # Check minimum length in PDF coordinates
                            line_length_pdf = (y - line_start - gap_count) * scale_factor
                            if line_length_pdf > min_line_length_pdf:
                                x1 = x * scale_factor
                                y1 = line_start * scale_factor  # No flip - pixmap uses top-left origin
                                x2 = x * scale_factor
                                y2 = (y - gap_count) * scale_factor
                                color = line_color or "#000000"
                                # Detect stroke width - for vertical lines, scan horizontally at line_start
                                detected_width = detect_stroke_width(pix, x, line_start, gray, threshold, is_horizontal=False)
                                stroke_width_pdf = detected_width * scale_factor * stroke_correction
                                if add_path_if_new({
                                    "type": "line",
                                    "points": [x1, y1, x2, y2],
                                    "stroke": color,
                                    "strokeWidth": max(min_stroke_width, stroke_width_pdf),
                                    "layer": line_layer or "base_building",
                                }):
                                    count += 1
                            line_start = None
                            line_color = None
                            line_layer = None
                
                # Handle line extending to edge
                if line_start is not None:
                    line_length_pdf = (gray.shape[0] - line_start) * scale_factor
                    if line_length_pdf > min_line_length_pdf:
                        x1 = x * scale_factor
                        y1 = line_start * scale_factor  # No flip - pixmap uses top-left origin
                        x2 = x * scale_factor
                        y2 = gray.shape[0] * scale_factor  # End at bottom of image
                        color = line_color or "#000000"
                        # Use detected stroke width from the line start
                        detected_width = detect_stroke_width(pix, x, line_start, gray, threshold, is_horizontal=False)
                        stroke_width_pdf = detected_width * scale_factor * stroke_correction
                        if add_path_if_new({
                            "type": "line",
                            "points": [x1, y1, x2, y2],
                            "stroke": color,
                            "strokeWidth": max(min_stroke_width, stroke_width_pdf),
                            "layer": line_layer or "base_building",
                        }):
                            count += 1
            
            # Diagonal line detection (for lines at angles)
            # Use edge detection to find lines at various angles
            if HAS_SCIPY:
                try:
                    from skimage import feature
                    edges = feature.canny(gray.astype(float) / 255.0, sigma=1.0, low_threshold=0.1, high_threshold=0.3)
                    # Extract lines from edges using Hough transform or simple tracing
                    # For now, we'll rely on horizontal/vertical detection which covers most cases
                    pass
                except:
                    pass
    except Exception as e:
        print(f"Error in extract_lines_from_pixmap: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        # Try fallback
        return extract_lines_fallback(pix, zoom, height, add_path_if_new)
    
    return count

def extract_lines_fallback(pix, zoom, height, add_path_if_new):
    """Fallback line extraction without numpy
    
    COORDINATE SYSTEM: Pixmap uses top-left origin (like images/canvas).
    No Y-flip needed - just scale pixmap coords to PDF coords.
    """
    count = 0
    scale_factor = 1.0 / zoom
    threshold = 240
    min_line_length_pdf = 0.5
    # Use hairline stroke width for fallback (1 pixel at zoom, corrected)
    default_stroke_width = 0.5 * scale_factor  # ~0.125 points
    
    try:
        width = pix.width
        height_pix = pix.height
        samples = pix.samples
        n = pix.n
        
        # Horizontal lines (fallback without numpy)
        for y in range(0, height_pix, 1):
            line_start = None
            line_color = None
            line_layer = None
            for x in range(width):
                    idx = (y * width + x) * n
                    if n == 1:
                        val = samples[idx]
                        r = g = b = val
                    else:
                        r = samples[idx]
                        g = samples[idx+1]
                        b = samples[idx+2]
                        val = int((r + g + b) / 3)
                    
                    if val < threshold:
                        estimated_width = 1 / zoom
                        layer = get_layer_from_color(r, g, b, estimated_width)
                        if layer is not None:  # Skip background
                            if line_start is None:
                                line_start = x
                                line_color = rgb_to_hex(r, g, b)
                                line_layer = layer
                    else:
                        if line_start is not None:
                            line_length_pdf = (x - line_start) / zoom
                            if line_length_pdf > min_line_length_pdf:
                                x1 = line_start / zoom
                                y1 = y / zoom  # No flip - pixmap uses top-left origin
                                x2 = x / zoom
                                y2 = y / zoom
                                color = line_color or "#000000"
                                if add_path_if_new({
                                    "type": "line",
                                    "points": [x1, y1, x2, y2],
                                    "stroke": color,
                                    "strokeWidth": default_stroke_width,
                                    "layer": line_layer or "base_building",
                                }):
                                    count += 1
                            line_start = None
                            line_color = None
                            line_layer = None
            
            if line_start is not None:
                line_length_pdf = (width - line_start) / zoom
                if line_length_pdf > min_line_length_pdf:
                    x1 = line_start / zoom
                    y1 = y / zoom  # No flip - pixmap uses top-left origin
                    x2 = width / zoom
                    y2 = y / zoom
                    color = line_color or "#000000"
                    if add_path_if_new({
                        "type": "line",
                        "points": [x1, y1, x2, y2],
                        "stroke": color,
                        "strokeWidth": default_stroke_width,
                        "layer": line_layer or "base_building",
                    }):
                        count += 1
        
        # Vertical lines (fallback without numpy)
        for x in range(0, width, 1):
            line_start = None
            line_color = None
            line_layer = None
            for y in range(height_pix):
                idx = (y * width + x) * n
                if n == 1:
                    val = samples[idx]
                    r = g = b = val
                else:
                    r = samples[idx]
                    g = samples[idx+1]
                    b = samples[idx+2]
                    val = int((r + g + b) / 3)
                
                if val < threshold:
                    estimated_width = 1 / zoom
                    layer = get_layer_from_color(r, g, b, estimated_width)
                    if layer is not None:  # Skip background
                        if line_start is None:
                            line_start = y
                            line_color = rgb_to_hex(r, g, b)
                            line_layer = layer
                else:
                    if line_start is not None:
                        line_length_pdf = (y - line_start) / zoom
                        if line_length_pdf > min_line_length_pdf:
                            x1 = x / zoom
                            y1 = line_start / zoom  # No flip - pixmap uses top-left origin
                            x2 = x / zoom
                            y2 = y / zoom
                            color = line_color or "#000000"
                            if add_path_if_new({
                                "type": "line",
                                "points": [x1, y1, x2, y2],
                                "stroke": color,
                                "strokeWidth": default_stroke_width,
                                "layer": line_layer or "base_building",
                            }):
                                count += 1
                        line_start = None
                        line_color = None
                        line_layer = None
            
            if line_start is not None:
                line_length_pdf = (height_pix - line_start) / zoom
                if line_length_pdf > min_line_length_pdf:
                    x1 = x / zoom
                    y1 = line_start / zoom  # No flip - pixmap uses top-left origin
                    x2 = x / zoom
                    y2 = height_pix / zoom  # End at bottom of image
                    color = line_color or "#000000"
                    if add_path_if_new({
                        "type": "line",
                        "points": [x1, y1, x2, y2],
                        "stroke": color,
                        "strokeWidth": default_stroke_width,
                        "layer": line_layer or "base_building",
                    }):
                        count += 1
    except Exception as e:
        print(f"Pixmap extraction error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
    
    return count

def parse_svg_path(d: str, height: float) -> list:
    """
    Parse SVG path data and extract coordinates
    Handles commands: M, L, H, V, C, S, Q, T, Z
    
    NOTE: SVG from PyMuPDF uses top-left origin (like canvas) - no Y flip needed!
    """
    import re
    points = []
    
    # Split into commands
    commands = re.findall(r'[MLHVCSQTAZ][^MLHVCSQTAZ]*', d, re.IGNORECASE)
    
    current_x = 0
    current_y = 0
    
    for cmd_str in commands:
        if not cmd_str:
            continue
        
        cmd = cmd_str[0].upper()
        coords_str = cmd_str[1:].strip()
        
        # Extract numbers
        numbers = re.findall(r'-?\d+\.?\d*', coords_str)
        coords = [float(n) for n in numbers]
        
        if cmd == 'M':  # Move to
            if len(coords) >= 2:
                current_x = coords[0]
                current_y = coords[1]  # No flip - already top-left origin
                points.extend([current_x, current_y])
        
        elif cmd == 'L':  # Line to
            if len(coords) >= 2:
                current_x = coords[0]
                current_y = coords[1]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'H':  # Horizontal line
            if len(coords) >= 1:
                current_x = coords[0]
                points.extend([current_x, current_y])
        
        elif cmd == 'V':  # Vertical line
            if len(coords) >= 1:
                current_y = coords[0]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'C':  # Cubic bezier
            if len(coords) >= 6:
                # Include control points for better accuracy
                # For now, we'll use the end point, but could add intermediate points
                current_x = coords[4]
                current_y = coords[5]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'S':  # Smooth cubic bezier
            if len(coords) >= 4:
                current_x = coords[2]
                current_y = coords[3]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'Q':  # Quadratic bezier
            if len(coords) >= 4:
                current_x = coords[2]
                current_y = coords[3]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'T':  # Smooth quadratic bezier
            if len(coords) >= 2:
                current_x = coords[0]
                current_y = coords[1]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'A':  # Arc
            if len(coords) >= 7:
                # Arc end point
                current_x = coords[5]
                current_y = coords[6]  # No flip
                points.extend([current_x, current_y])
        
        elif cmd == 'Z':  # Close path
            # Connect back to start
            if len(points) >= 2:
                points.extend([points[0], points[1]])
    
    return points

def parse_polygon_points(points_str: str, height: float) -> list:
    """Parse polygon/polyline points attribute
    
    NOTE: SVG from PyMuPDF uses top-left origin - no Y flip needed!
    """
    import re
    points = []
    numbers = re.findall(r'-?\d+\.?\d*', points_str)
    for i in range(0, len(numbers) - 1, 2):
        if i + 1 < len(numbers):
            x = float(numbers[i])
            y = float(numbers[i + 1])  # No flip - already top-left origin
            points.extend([x, y])
    return points

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}), file=sys.stdout)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    try:
        result = extract_pdf_vectors(pdf_path)
        # Output JSON to stdout (debug messages go to stderr)
        print(json.dumps(result), file=sys.stdout)
        sys.exit(0)
    except Exception as e:
        error_result = {
            "error": str(e),
            "texts": [],
            "paths": [],
            "bounds": {"width": 0, "height": 0},
            "isVector": False
        }
        print(json.dumps(error_result), file=sys.stdout)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
