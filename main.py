import h3
import geopandas as gpd
from shapely.geometry import Polygon

# Load your GeoJSON file
points_gdf = gpd.read_file('examplePoints.geojson')

def create_hex_grid(points_gdf, resolution):
    hex_set = set()

    # Iterate over each point and add its hexagon to the set
    for point in points_gdf.geometry:
        hex_id = h3.geo_to_h3(point.y, point.x, resolution)
        hex_set.add(hex_id)
    
    # Create hexagon geometries
    hex_geoms = [Polygon(h3.h3_to_geo_boundary(hex_id, geo_json=True)) for hex_id in hex_set]

    # Create a GeoDataFrame with hexagon geometries
    hex_gdf = gpd.GeoDataFrame(geometry=hex_geoms)
    return hex_gdf

# Adjust the resolution as needed
resolution = 7
hex_gdf = create_hex_grid(points_gdf, resolution)

# Save hex grid to a GeoJSON file
hex_gdf.to_file('hex_grid.geojson', driver='GeoJSON')
