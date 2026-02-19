"""
WebSocket Manager for real-time updates

Handles Socket.IO connections and broadcasts for training progress
and prediction updates
"""

import socketio
import logging
import os

logger = logging.getLogger(__name__)

# Configure verbose Socket.IO / Engine.IO logging (overridable via env)
WEBSOCKET_VERBOSE_LOGGING = os.getenv("WEBSOCKET_VERBOSE_LOGGING", "true").lower() == "true"

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=WEBSOCKET_VERBOSE_LOGGING,
    engineio_logger=WEBSOCKET_VERBOSE_LOGGING
)


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_established', {'sid': sid}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def subscribe(sid, data):
    """
    Subscribe to a channel
    
    Channels:
    - training:{session_id} - Training progress updates
    - predictions:{symbol} - Real-time prediction updates
    - market:{symbol} - Market data updates
    """
    channel = data.get('channel')
    if not channel:
        await sio.emit('error', {'message': 'Channel not specified'}, room=sid)
        return
    
    await sio.enter_room(sid, channel)
    logger.info(f"Client {sid} subscribed to {channel}")
    
    await sio.emit('subscribed', {
        'channel': channel,
        'message': f'Successfully subscribed to {channel}'
    }, room=sid)


@sio.event
async def unsubscribe(sid, data):
    """Unsubscribe from a channel"""
    channel = data.get('channel')
    if not channel:
        await sio.emit('error', {'message': 'Channel not specified'}, room=sid)
        return
    
    await sio.leave_room(sid, channel)
    logger.info(f"Client {sid} unsubscribed from {channel}")
    
    await sio.emit('unsubscribed', {
        'channel': channel,
        'message': f'Successfully unsubscribed from {channel}'
    }, room=sid)


# Utility functions for broadcasting

async def broadcast_training_progress(session_id: str, data: dict):
    """
    Broadcast training progress update
    
    Args:
        session_id: Training session ID
        data: Progress data (epoch, loss, progress percentage, etc.)
    """
    channel = f"training:{session_id}"
    await sio.emit('training_progress', data, room=channel)
    logger.debug(f"Broadcasted training progress to {channel}: {data}")


async def broadcast_training_complete(session_id: str, data: dict):
    """
    Broadcast training completion
    
    Args:
        session_id: Training session ID
        data: Completion data (metrics, model info, etc.)
    """
    channel = f"training:{session_id}"
    await sio.emit('training_complete', data, room=channel)
    logger.info(f"Broadcasted training completion to {channel}")


async def broadcast_training_failed(session_id: str, error: str):
    """
    Broadcast training failure
    
    Args:
        session_id: Training session ID
        error: Error message
    """
    channel = f"training:{session_id}"
    await sio.emit('training_failed', {'error': error}, room=channel)
    logger.error(f"Broadcasted training failure to {channel}: {error}")


async def broadcast_prediction(symbol: str, data: dict):
    """
    Broadcast new prediction
    
    Args:
        symbol: Trading symbol
        data: Prediction data
    """
    channel = f"predictions:{symbol}"
    await sio.emit('new_prediction', data, room=channel)
    logger.debug(f"Broadcasted prediction to {channel}")


async def broadcast_market_update(symbol: str, data: dict):
    """
    Broadcast market data update
    
    Args:
        symbol: Trading symbol
        data: Market data
    """
    channel = f"market:{symbol}"
    await sio.emit('market_update', data, room=channel)
    logger.debug(f"Broadcasted market update to {channel}")


# Export singleton instance
__all__ = [
    'sio',
    'broadcast_training_progress',
    'broadcast_training_complete',
    'broadcast_training_failed',
    'broadcast_prediction',
    'broadcast_market_update'
]
