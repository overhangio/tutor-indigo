__version__ = "16.0.0"
__package_version__ = __version__

# Handle version suffix for nightly, just like tutor core.
__version_suffix__ = "nightly"

if __version_suffix__:
    __version__ += "-" + __version_suffix__
