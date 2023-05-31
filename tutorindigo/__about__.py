__version__ = "16.0.0"

# Handle version suffix for nightly, just like tutor core.
__version_suffix__ = ""

if __version_suffix__:
    __version__ += "-" + __version_suffix__
